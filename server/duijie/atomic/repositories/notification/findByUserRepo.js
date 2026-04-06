const db = require('../../../config/db');

module.exports = async (userId, limit, category, offset = 0) => {
  let sql = `SELECT n.*, p.name AS project_name
    FROM duijie_notifications n
    LEFT JOIN duijie_projects p ON n.project_id = p.id
    WHERE n.user_id = ?`;
  let countSql = 'SELECT COUNT(*) as total FROM duijie_notifications WHERE user_id = ?';
  const params = [userId];
  const countParams = [userId];
  if (category === 'project') {
    sql += ' AND n.project_id IS NOT NULL';
    countSql += ' AND project_id IS NOT NULL';
  } else if (category && category !== 'all') {
    sql += ' AND n.category = ?';
    countSql += ' AND category = ?';
    params.push(category);
    countParams.push(category);
  }
  sql += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await db.query(sql, params);
  const [[{ total }]] = await db.query(countSql, countParams);

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

  const [[projectUnread]] = await db.query(
    'SELECT COUNT(*) as count FROM duijie_notifications WHERE user_id = ? AND is_read = 0 AND project_id IS NOT NULL',
    [userId]
  );
  unreadByCategory.project = projectUnread.count;

  return { notifications: rows, unreadCount: count, unreadByCategory, total, page: Math.floor(offset / limit) + 1, pageSize: limit };
};
