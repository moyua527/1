const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const [rows] = await db.query(
      'SELECT * FROM duijie_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [req.userId, limit]
    );
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) as count FROM duijie_notifications WHERE user_id = ? AND is_read = 0',
      [req.userId]
    );
    res.json({ success: true, data: { notifications: rows, unreadCount: count } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
