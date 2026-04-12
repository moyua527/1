const db = require('../../../config/db');
const { notify } = require('../../utils/notify');
const logger = require('../../../config/logger');

const COOLDOWN_MS = 30 * 60 * 1000; // 30 min

module.exports = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const [[task]] = await db.query(
      `SELECT t.id, t.title, t.assignee_id, t.project_id, t.status, p.name as project_name
       FROM duijie_tasks t LEFT JOIN duijie_projects p ON p.id = t.project_id
       WHERE t.id = ? AND t.is_deleted = 0`, [taskId]
    );
    if (!task) return res.status(404).json({ success: false, message: '任务不存在' });
    if (!task.assignee_id) return res.status(400).json({ success: false, message: '任务没有负责人' });
    if (task.status === 'accepted') return res.status(400).json({ success: false, message: '任务已完成，无需催办' });

    const [[recent]] = await db.query(
      `SELECT id FROM duijie_notifications
       WHERE user_id = ? AND type = 'task_remind' AND content LIKE ? AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       LIMIT 1`,
      [task.assignee_id, `%任务「${task.title}」%`]
    );
    if (recent) return res.status(429).json({ success: false, message: '30分钟内已催办过，请稍后再试' });

    const [[sender]] = await db.query('SELECT nickname, username FROM voice_users WHERE id = ?', [req.userId]);
    const senderName = sender?.nickname || sender?.username || '某人';
    const pPrefix = task.project_name ? `【${task.project_name}】` : '';

    await notify(
      task.assignee_id,
      'task_remind',
      '任务催办',
      `${pPrefix}${senderName}催你完成任务「${task.title}」`,
      '/tasks',
      task.project_id
    );

    logger.info(`task remind: user ${req.userId} -> assignee ${task.assignee_id}, task ${taskId}`);
    res.json({ success: true, message: '催办已发送' });
  } catch (e) {
    logger.error(`task remind error: ${e.message}`);
    res.status(500).json({ success: false, message: '催办失败' });
  }
};
