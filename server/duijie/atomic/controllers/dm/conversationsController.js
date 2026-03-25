const listConversations = require('../../services/dm/listConversations');

module.exports = async (req, res) => {
  try {
    const rows = await listConversations(req.userId);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
