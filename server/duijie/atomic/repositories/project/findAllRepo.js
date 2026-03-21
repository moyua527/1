const db = require('../../../config/db');
const getSubordinateIds = require('../../utils/getSubordinateIds');

module.exports = async ({ status, client_id, page = 1, limit = 20 }, auth = {}) => {
  let sql = 'SELECT p.*, c.name as client_name FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id WHERE p.is_deleted = 0';
  let countSql = 'SELECT COUNT(*) as total FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id WHERE p.is_deleted = 0';
  const params = [];
  const countParams = [];

  const isMember = '(p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';

  if (auth.role === 'admin' || auth.role === 'viewer') {
    // 全部可见
  } else if (auth.role === 'sales_manager' && auth.userId) {
    const teamIds = await getSubordinateIds(auth.userId);
    const ph = teamIds.map(() => '?').join(',');
    const filter = ` AND (p.client_id IN (SELECT id FROM duijie_clients WHERE (assigned_to IN (${ph}) OR created_by IN (${ph})) AND is_deleted = 0) OR ${isMember})`;
    sql += filter; countSql += filter;
    params.push(...teamIds, ...teamIds, auth.userId, auth.userId);
    countParams.push(...teamIds, ...teamIds, auth.userId, auth.userId);
  } else if (auth.role === 'business' && auth.userId) {
    const filter = ` AND (p.client_id IN (SELECT id FROM duijie_clients WHERE (assigned_to = ? OR created_by = ?) AND is_deleted = 0) OR ${isMember})`;
    sql += filter; countSql += filter;
    params.push(auth.userId, auth.userId, auth.userId, auth.userId);
    countParams.push(auth.userId, auth.userId, auth.userId, auth.userId);
  } else if (auth.role === 'marketing') {
    const filter = ` AND (p.client_id IN (SELECT id FROM duijie_clients WHERE stage IN ('potential','intent') AND is_deleted = 0) OR ${isMember})`;
    sql += filter; countSql += filter;
    params.push(auth.userId, auth.userId);
    countParams.push(auth.userId, auth.userId);
  } else if (auth.role === 'support') {
    const filter = ` AND (p.client_id IN (SELECT id FROM duijie_clients WHERE stage IN ('signed','active') AND is_deleted = 0) OR ${isMember})`;
    sql += filter; countSql += filter;
    params.push(auth.userId, auth.userId);
    countParams.push(auth.userId, auth.userId);
  } else if (auth.role === 'client' && auth.clientId) {
    sql += ' AND p.client_id IN (SELECT id FROM duijie_clients WHERE user_id = ? AND is_deleted = 0)';
    countSql += ' AND p.client_id IN (SELECT id FROM duijie_clients WHERE user_id = ? AND is_deleted = 0)';
    params.push(auth.userId);
    countParams.push(auth.userId);
  } else if (auth.userId) {
    sql += ` AND ${isMember}`; countSql += ` AND ${isMember}`;
    params.push(auth.userId, auth.userId);
    countParams.push(auth.userId, auth.userId);
  }

  if (status) { sql += ' AND p.status = ?'; countSql += ' AND p.status = ?'; params.push(status); countParams.push(status); }
  if (client_id) { sql += ' AND p.client_id = ?'; countSql += ' AND p.client_id = ?'; params.push(client_id); countParams.push(client_id); }
  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const [rows] = await db.query(sql, params);
  const [[{ total }]] = await db.query(countSql, countParams);
  return { rows, total };
};
