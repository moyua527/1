const sendMessage = require('../../services/message/sendMessage');

module.exports = async (req, res) => {
  try {
    const id = await sendMessage({ ...req.body, sender_id: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
