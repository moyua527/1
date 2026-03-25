const sendMessage = require('../../services/dm/sendMessage');
const { getIO } = require('../../../socket');

module.exports = async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content || !content.trim()) return res.status(400).json({ success: false, message: '参数不完整' });
    const insertId = await sendMessage(req.userId, receiver_id, content.trim());
    const io = getIO();
    if (io) {
      const payload = { id: insertId, sender_id: req.userId, receiver_id: Number(receiver_id) };
      io.to(`user:${receiver_id}`).emit('new_dm', payload);
      io.to(`user:${req.userId}`).emit('new_dm', payload);
    }
    res.json({ success: true, data: { id: insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
