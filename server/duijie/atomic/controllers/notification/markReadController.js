const markRead = require('../../services/notification/markRead');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    await markRead(id, req.userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
