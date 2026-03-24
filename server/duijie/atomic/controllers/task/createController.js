const createTask = require('../../services/task/createTask');
const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const id = await createTask({ ...req.body, created_by: req.userId });
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        await db.query(
          'INSERT INTO duijie_task_attachments (task_id, filename, original_name, file_size, mime_type, created_by) VALUES (?,?,?,?,?,?)',
          [id, f.filename, Buffer.from(f.originalname, 'latin1').toString('utf8'), f.size, f.mimetype, req.userId]
        );
      }
    }
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
