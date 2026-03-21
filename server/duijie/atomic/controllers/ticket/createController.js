const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { title, content, type, priority, project_id } = req.body;
    if (!title) return res.status(400).json({ success: false, message: '标题必填' });
    const [r] = await db.query(
      'INSERT INTO duijie_tickets (title, content, type, priority, project_id, created_by) VALUES (?,?,?,?,?,?)',
      [title, content || '', type || 'question', priority || 'medium', project_id || null, req.userId]
    );
    const ticketId = r.insertId;
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        await db.query(
          'INSERT INTO duijie_ticket_attachments (ticket_id, reply_id, filename, original_name, file_size, mime_type, created_by) VALUES (?,?,?,?,?,?,?)',
          [ticketId, null, f.filename, Buffer.from(f.originalname, 'latin1').toString('utf8'), f.size, f.mimetype, req.userId]
        );
      }
    }
    res.json({ success: true, data: { id: ticketId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
