const db = require('../../../config/db');

module.exports = async (userId, limit) => {
  const [rows] = await db.query(
    'SELECT * FROM duijie_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    [userId, limit]
  );
  const [[{ count }]] = await db.query(
    'SELECT COUNT(*) as count FROM duijie_notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return { notifications: rows, unreadCount: count };
};
