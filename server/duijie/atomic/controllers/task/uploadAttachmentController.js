const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const taskId = req.params.id || req.body.task_id;
    if (!taskId) return res.status(400).json({ success: false, message: '缺少任务ID' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: '没有上传文件' });

    const inserted = [];
    for (const f of req.files) {
      const [result] = await db.query(
        'INSERT INTO duijie_task_attachments (task_id, filename, original_name, file_size, mime_type, created_by) VALUES (?,?,?,?,?,?)',
        [taskId, f.filename, Buffer.from(f.originalname, 'latin1').toString('utf8'), f.size, f.mimetype, req.userId]
      );
      inserted.push({ id: result.insertId, filename: f.filename, original_name: Buffer.from(f.originalname, 'latin1').toString('utf8'), file_size: f.size });
    }
    res.json({ success: true, data: inserted });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
