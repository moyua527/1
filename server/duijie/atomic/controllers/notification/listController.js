const listNotifications = require('../../services/notification/listNotifications');

module.exports = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * limit;
    const category = req.query.category || 'all';
    const data = await listNotifications(req.userId, limit, category, offset);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
