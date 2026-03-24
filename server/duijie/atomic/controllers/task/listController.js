const listTasks = require('../../services/task/listTasks');
const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const data = await listTasks(req.query.project_id, { role: req.userRole, userId: req.userId });
    if (data.length > 0) {
      const ids = data.map(t => t.id);
      const [attachments] = await db.query(
        `SELECT id, task_id, filename, original_name, file_size, mime_type, created_at FROM duijie_task_attachments WHERE task_id IN (${ids.map(() => '?').join(',')})`, ids
      );
      for (const t of data) {
        t.attachments = attachments.filter(a => a.task_id === t.id);
      }
    }
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
