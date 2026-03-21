const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { title, client_id, amount, probability, stage, expected_close, assigned_to, notes } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: '请输入商机标题' });
    const [result] = await db.query(
      'INSERT INTO duijie_opportunities (title, client_id, amount, probability, stage, expected_close, assigned_to, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title.trim(), client_id || null, amount || 0, probability || 50, stage || 'lead', expected_close || null, assigned_to || null, notes || null, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
