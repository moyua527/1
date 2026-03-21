const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content || !content.trim()) return res.status(400).json({ success: false, message: '参数不完整' });
    const [result] = await db.query(
      'INSERT INTO duijie_direct_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.userId, receiver_id, content.trim()]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
