const moveTask = require('../../services/task/moveTask');
const { broadcast } = require('../../utils/broadcast');
const { notify } = require('../../utils/notify');
const db = require('../../../config/db');
const { logActivity } = require('../../utils/activityLogger');

/** 允许的状态转移 */
const ALLOWED_TRANSITIONS = {
  todo: ['submitted', 'in_progress'],       // 兼容旧数据
  submitted: ['disputed', 'in_progress'],    // 提疑问 / 接受任务
  disputed: ['submitted'],                   // 补充后回到已提出 (由系统自动触发)
  in_progress: ['pending_review'],           // 提交验收
  pending_review: ['review_failed', 'accepted'], // 驳回 / 通过
  review_failed: ['pending_review'],         // 修复后重新验收 (由系统自动触发)
  accepted: [],                              // 终态
};

/** 状态标签 */
const STATUS_LABEL = {
  todo: '待办', submitted: '已提出', disputed: '待补充',
  in_progress: '执行中', pending_review: '待验收',
  review_failed: '验收不通过', accepted: '验收通过',
};

module.exports = async (req, res) => {
  try {
    const newStatus = req.body.status;
    let taskRow = null;
    if (newStatus) {
      const [rows] = await db.query(
        'SELECT status, project_id, created_by, assignee_id, title FROM duijie_tasks WHERE id = ? AND is_deleted = 0',
        [req.params.id]
      );
      if (!rows[0]) return res.status(404).json({ success: false, message: '任务不存在' });
      taskRow = rows[0];
      const current = rows[0].status;
      const allowed = ALLOWED_TRANSITIONS[current] || [];
      if (current !== newStatus && !allowed.includes(newStatus)) {
        return res.status(422).json({ success: false, message: `不允许从「${STATUS_LABEL[current] || current}」转移到「${STATUS_LABEL[newStatus] || newStatus}」`, code: 42201 });
      }

      // 权限检查：谁可以执行哪些转移
      const isAssignee = taskRow.assignee_id === req.userId;
      const isCreator = taskRow.created_by === req.userId;
      const noAssignee = !taskRow.assignee_id;

      // 接受任务 / 提疑问：负责人或无负责人时任何人
      if ((newStatus === 'in_progress' && current === 'submitted') || newStatus === 'disputed') {
        if (!isAssignee && !noAssignee && !isCreator) {
          return res.status(403).json({ success: false, message: '只有任务负责人可以执行此操作' });
        }
      }
      // 提交验收：负责人或无负责人时
      if (newStatus === 'pending_review' && (current === 'in_progress' || current === 'review_failed')) {
        if (!isAssignee && !noAssignee && !isCreator) {
          return res.status(403).json({ success: false, message: '只有任务负责人可以提交验收' });
        }
      }
      // 验收通过/驳回：创建者、或无负责人时、或非负责人
      if (newStatus === 'accepted' || newStatus === 'review_failed') {
        if (isAssignee && !isCreator && !noAssignee) {
          return res.status(403).json({ success: false, message: '任务负责人不能验收自己的任务' });
        }
      }

      // 项目角色权限校验（细粒度 move 权限）
      const perms = req.projectPerms;
      if (perms && req.userRole !== 'admin') {
        const TRANSITION_PERM = {
          'submitted->in_progress': 'can_move_task_accept',
          'submitted->disputed':    'can_move_task_dispute',
          'disputed->submitted':    'can_move_task_supplement',
          'in_progress->pending_review': 'can_move_task_submit_review',
          'pending_review->review_failed': 'can_move_task_reject',
          'pending_review->accepted': 'can_move_task_approve',
          'review_failed->pending_review': 'can_move_task_resubmit',
          'todo->submitted':        'can_move_task_accept',
          'todo->in_progress':      'can_move_task_accept',
        };
        const key = `${current}->${newStatus}`;
        const needed = TRANSITION_PERM[key];
        if (needed && !perms[needed]) {
          return res.status(403).json({ success: false, message: '无权执行此状态转移' });
        }
      }
    }
    if (!taskRow) {
      const [rows] = await db.query('SELECT project_id, created_by, assignee_id, title FROM duijie_tasks WHERE id = ? AND is_deleted = 0', [req.params.id]);
      if (!rows[0]) return res.status(404).json({ success: false, message: '任务不存在' });
      taskRow = rows[0];
    }
    await moveTask(req.params.id, req.body.status, req.body.sort_order);

    // 通知对方
    if (newStatus && taskRow.title) {
      let projectName = '';
      if (taskRow.project_id) {
        const [[proj]] = await db.query('SELECT name FROM duijie_projects WHERE id = ?', [taskRow.project_id]);
        projectName = proj?.name || '';
      }
      const pPrefix = projectName ? `【${projectName}】` : '';
      const label = STATUS_LABEL[newStatus] || newStatus;
      let targetId = null;
      if (newStatus === 'in_progress' && taskRow.created_by !== req.userId) targetId = taskRow.created_by;
      if (newStatus === 'pending_review' && taskRow.created_by !== req.userId) targetId = taskRow.created_by;
      if (newStatus === 'accepted' && taskRow.assignee_id !== req.userId) targetId = taskRow.assignee_id;
      if (targetId) {
        await notify(targetId, 'task_status', '任务状态变更', `${pPrefix}任务「${taskRow.title}」状态变为「${label}」`, '/tasks', taskRow.project_id != null ? Number(taskRow.project_id) : null);
      }
    }

    if (newStatus && taskRow.project_id) {
      const label = STATUS_LABEL[newStatus] || newStatus;
      logActivity(taskRow.project_id, req.userId, 'task_status', { entityType: 'task', entityId: Number(req.params.id), title: `${taskRow.title} → ${label}`, detail: { from: taskRow.status, to: newStatus } });
    }
    broadcast('task', 'updated', { id: req.params.id, project_id: taskRow.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('任务状态转移失败:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
