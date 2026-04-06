const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { notify } = require('../../utils/notify');

/**
 * GET /tasks/:id/review-points
 * 获取任务的审核要点列表
 */
exports.list = async (req, res) => {
  try {
    const taskId = req.params.id;
    const [points] = await db.query(
      `SELECT rp.*, u.nickname AS author_name, ru.nickname AS responder_name
       FROM duijie_task_review_points rp
       LEFT JOIN voice_users u ON u.id = rp.author_id
       LEFT JOIN voice_users ru ON ru.id = rp.response_by
       WHERE rp.task_id = ?
       ORDER BY rp.created_at ASC`,
      [taskId]
    );
    res.json({ success: true, data: points });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

/**
 * POST /tasks/:id/review-points
 * 添加审核要点（批量）
 * body: { points: Array<{ content: string, images?: string[] }>, round_type: 'initial' | 'acceptance' }
 *   兼容旧格式 points: string[]
 */
exports.add = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { points, round_type } = req.body;
    if (!points || !Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ success: false, message: '请提供至少一个审核要点' });
    }
    if (!['initial', 'acceptance'].includes(round_type)) {
      return res.status(400).json({ success: false, message: '无效的审核类型' });
    }

    const [[task]] = await db.query('SELECT id, status, project_id, created_by, assignee_id, title FROM duijie_tasks WHERE id = ? AND is_deleted = 0', [taskId]);
    if (!task) return res.status(404).json({ success: false, message: '任务不存在' });

    if (round_type === 'initial' && task.assignee_id && task.assignee_id !== req.userId) {
      return res.status(403).json({ success: false, message: '只有任务负责人可以提出初审疑问' });
    }
    if (round_type === 'acceptance' && task.assignee_id && task.assignee_id === req.userId && task.created_by !== req.userId) {
      return res.status(403).json({ success: false, message: '任务负责人不能驳回自己的任务' });
    }

    const values = points
      .map(p => typeof p === 'string' ? { content: p, images: null } : p)
      .filter(p => p.content?.trim())
      .map(p => [taskId, round_type, req.userId, p.content.trim(), p.images && p.images.length > 0 ? JSON.stringify(p.images) : null]);
    if (values.length === 0) return res.status(400).json({ success: false, message: '要点内容不能为空' });

    await db.query(
      'INSERT INTO duijie_task_review_points (task_id, round_type, author_id, content, images) VALUES ?',
      [values]
    );

    const newStatus = round_type === 'initial' ? 'disputed' : 'review_failed';
    await db.query('UPDATE duijie_tasks SET status = ? WHERE id = ?', [newStatus, taskId]);

    const targetUserId = round_type === 'initial' ? task.created_by : task.assignee_id;
    if (targetUserId && targetUserId !== req.userId) {
      const label = round_type === 'initial' ? '提出了疑问' : '验收驳回';
      await notify(targetUserId, 'task_status', '任务审核', `任务「${task.title}」${label}，共 ${values.length} 个要点需要处理`, '/tasks');
    }

    broadcast('task', 'updated', { id: taskId, project_id: task.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('添加审核要点失败:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

/**
 * PUT /tasks/review-points/:pointId
 * 编辑审核要点内容/图片（仅提出人可编辑，且状态为 pending）
 * body: { content?: string, images?: string[] }
 */
exports.update = async (req, res) => {
  try {
    const pointId = req.params.pointId;
    const { content, images } = req.body;

    const [[point]] = await db.query(
      `SELECT rp.*, t.project_id FROM duijie_task_review_points rp JOIN duijie_tasks t ON t.id = rp.task_id WHERE rp.id = ?`,
      [pointId]
    );
    if (!point) return res.status(404).json({ success: false, message: '要点不存在' });
    if (point.author_id !== req.userId) return res.status(403).json({ success: false, message: '只有提出人可以编辑' });

    const updates = [];
    const params = [];
    if (content !== undefined && content.trim()) { updates.push('content = ?'); params.push(content.trim()); }
    if (images !== undefined) { updates.push('images = ?'); params.push(images && images.length > 0 ? JSON.stringify(images) : null); }
    if (updates.length === 0) return res.status(400).json({ success: false, message: '没有需要更新的内容' });

    params.push(pointId);
    await db.query(`UPDATE duijie_task_review_points SET ${updates.join(', ')} WHERE id = ?`, params);

    broadcast('task', 'updated', { id: point.task_id, project_id: point.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('编辑审核要点失败:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

/**
 * PUT /tasks/review-points/:pointId/respond
 * 回复审核要点
 * body: { response: string }
 */
exports.respond = async (req, res) => {
  try {
    const pointId = req.params.pointId;
    const { response } = req.body;
    if (!response || !response.trim()) {
      return res.status(400).json({ success: false, message: '回复内容不能为空' });
    }

    const [[point]] = await db.query(
      `SELECT rp.*, t.project_id, t.created_by, t.assignee_id, t.title AS task_title
       FROM duijie_task_review_points rp
       JOIN duijie_tasks t ON t.id = rp.task_id
       WHERE rp.id = ?`,
      [pointId]
    );
    if (!point) return res.status(404).json({ success: false, message: '审核要点不存在' });
    if (point.status !== 'pending') {
      return res.status(422).json({ success: false, message: '该要点已回复' });
    }

    await db.query(
      'UPDATE duijie_task_review_points SET response = ?, response_by = ?, response_at = NOW(), status = ? WHERE id = ?',
      [response.trim(), req.userId, 'answered', pointId]
    );

    // 检查是否所有要点都已回答 → 可通知提出人
    const [remaining] = await db.query(
      'SELECT COUNT(*) AS cnt FROM duijie_task_review_points WHERE task_id = ? AND round_type = ? AND status = ?',
      [point.task_id, point.round_type, 'pending']
    );

    if (remaining[0].cnt === 0) {
      // 所有要点已回答
      if (point.round_type === 'initial') {
        // 初审所有要点回答完毕 → 任务回到 submitted
        await db.query('UPDATE duijie_tasks SET status = ? WHERE id = ?', ['submitted', point.task_id]);
      } else {
        // 验收所有要点回答完毕 → 任务回到 pending_review
        await db.query('UPDATE duijie_tasks SET status = ? WHERE id = ?', ['pending_review', point.task_id]);
      }
      // 通知提出人
      if (point.author_id !== req.userId) {
        const label = point.round_type === 'initial' ? '已补充所有疑问' : '已修复所有问题';
        await notify(point.author_id, 'task_status', '任务审核', `任务「${point.task_title}」${label}，请查看`, '/tasks');
      }
      broadcast('task', 'updated', { id: point.task_id, project_id: point.project_id, userId: req.userId });
    }

    res.json({ success: true });
  } catch (e) {
    console.error('回复审核要点失败:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};

/**
 * PUT /tasks/review-points/:pointId/confirm
 * 确认审核要点（开发人员确认某个初审要点没问题）
 */
exports.confirm = async (req, res) => {
  try {
    const pointId = req.params.pointId;
    const [[point]] = await db.query(
      `SELECT rp.*, t.project_id, t.created_by, t.assignee_id, t.title AS task_title
       FROM duijie_task_review_points rp
       JOIN duijie_tasks t ON t.id = rp.task_id
       WHERE rp.id = ?`,
      [pointId]
    );
    if (!point) return res.status(404).json({ success: false, message: '审核要点不存在' });
    if (point.status !== 'answered') {
      return res.status(422).json({ success: false, message: '该要点尚未回答或已确认' });
    }

    await db.query(
      'UPDATE duijie_task_review_points SET status = ?, confirmed_at = NOW() WHERE id = ?',
      ['confirmed', pointId]
    );

    broadcast('task', 'updated', { id: point.task_id, project_id: point.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('确认审核要点失败:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
