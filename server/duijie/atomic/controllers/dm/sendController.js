const db = require('../../../config/db');
const { getIO } = require('../../../socket');

module.exports = async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content || !content.trim()) return res.status(400).json({ success: false, message: '参数不完整' });
    const [result] = await db.query(
      'INSERT INTO duijie_direct_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.userId, receiver_id, content.trim()]
    );
    const io = getIO();
    if (io) {
      const payload = { id: result.insertId, sender_id: req.userId, receiver_id: Number(receiver_id) };
      io.to(`user:${receiver_id}`).emit('new_dm', payload);
      io.to(`user:${req.userId}`).emit('new_dm', payload);
    }
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
