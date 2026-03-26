const db = require('../../../config/db');

module.exports = async (userId, limit, category) => {
  let sql = 'SELECT * FROM duijie_notifications WHERE user_id = ?';
  const params = [userId];
  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  const [rows] = await db.query(sql, params);

  const [[{ count }]] = await db.query(
    'SELECT COUNT(*) as count FROM duijie_notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  const [catCounts] = await db.query(
    "SELECT COALESCE(category, 'system') as category, COUNT(*) as count FROM duijie_notifications WHERE user_id = ? AND is_read = 0 GROUP BY COALESCE(category, 'system')",
    [userId]
  );
  const unreadByCategory = {};
  for (const r of catCounts) unreadByCategory[r.category] = r.count;

  return { notifications: rows, unreadCount: count, unreadByCategory };
};
