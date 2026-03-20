const db = require('../../../config/db');

module.exports = async ({ status, client_id, page = 1, limit = 20 }, auth = {}) => {
  let sql = 'SELECT p.*, c.name as client_name FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id WHERE p.is_deleted = 0';
  let countSql = 'SELECT COUNT(*) as total FROM duijie_projects p WHERE p.is_deleted = 0';
  const params = [];
  const countParams = [];

  if (auth.role === 'client' && auth.clientId) {
    sql += ' AND p.client_id = ?';
    countSql += ' AND p.client_id = ?';
    params.push(auth.clientId);
    countParams.push(auth.clientId);
  } else if (auth.role === 'member' && auth.userId) {
    sql += ' AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';
    countSql += ' AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';
    params.push(auth.userId, auth.userId);
    countParams.push(auth.userId, auth.userId);
  }

  if (status) { sql += ' AND p.status = ?'; params.push(status); }
  if (client_id) { sql += ' AND p.client_id = ?'; params.push(client_id); }
  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const [rows] = await db.query(sql, params);
  const [[{ total }]] = await db.query(countSql, countParams);
  return { rows, total };
};
