const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const [[task]] = await db.query(
      `SELECT t.*, u.nickname as creator_name, u.username as creator_username,
              a.nickname as assignee_name, a.username as assignee_username
       FROM duijie_tasks t
       LEFT JOIN voice_users u ON u.id = t.created_by
       LEFT JOIN voice_users a ON a.id = t.assignee_id
       WHERE t.id = ? AND t.is_deleted = 0`, [taskId]
    );
    if (!task) return res.status(404).json({ success: false, message: '需求不存在' });

    const [attachments] = await db.query(
      'SELECT id, task_id, filename, original_name, file_size, mime_type, created_at FROM duijie_task_attachments WHERE task_id = ?', [taskId]
    );
    task.attachments = attachments;

    res.json({ success: true, data: task });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
