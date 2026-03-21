const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { title, content, type, priority, project_id } = req.body;
    if (!title) return res.status(400).json({ success: false, message: '标题必填' });
    const [r] = await db.query(
      'INSERT INTO duijie_tickets (title, content, type, priority, project_id, created_by) VALUES (?,?,?,?,?,?)',
      [title, content || '', type || 'question', priority || 'medium', project_id || null, req.userId]
    );
    res.json({ success: true, data: { id: r.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
