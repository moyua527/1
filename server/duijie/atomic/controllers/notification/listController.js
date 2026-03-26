const listNotifications = require('../../services/notification/listNotifications');

module.exports = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const category = req.query.category || 'all';
    const data = await listNotifications(req.userId, limit, category);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
