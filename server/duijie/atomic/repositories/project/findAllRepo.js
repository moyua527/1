const db = require('../../../config/db');
const logger = require('../../../config/logger');

module.exports = async ({ status, client_id, page = 1, limit = 20 }, auth = {}) => {
  let sql = 'SELECT p.*, COALESCE(u.nickname, u.username) as created_by_name, c.name as client_name, c.company as client_company, ic.name as internal_client_name, ic.company as internal_client_company, pm_self.nickname as my_nickname, (SELECT COUNT(*) FROM duijie_project_members pm2 WHERE pm2.project_id = p.id) as member_count, (SELECT COUNT(*) FROM duijie_tasks t WHERE t.project_id = p.id) as task_count FROM duijie_projects p LEFT JOIN voice_users u ON p.created_by = u.id LEFT JOIN duijie_clients c ON p.client_id = c.id LEFT JOIN duijie_clients ic ON p.internal_client_id = ic.id LEFT JOIN duijie_project_members pm_self ON pm_self.project_id = p.id AND pm_self.user_id = ? WHERE p.is_deleted = 0';
  let countSql = 'SELECT COUNT(*) as total FROM duijie_projects p LEFT JOIN voice_users u ON p.created_by = u.id LEFT JOIN duijie_clients c ON p.client_id = c.id LEFT JOIN duijie_clients ic ON p.internal_client_id = ic.id WHERE p.is_deleted = 0';
  const params = [auth.userId || 0];
  const countParams = [];

  const isMember = '(p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';

  if (auth.role === 'admin') {
    // 全部可见
  } else if (auth.userId) {
    if (auth.clientId) {
      const filter = ` AND (p.client_id = ? OR ${isMember})`;
      sql += filter; countSql += filter;
      params.push(auth.clientId, auth.userId, auth.userId);
      countParams.push(auth.clientId, auth.userId, auth.userId);
    } else {
      sql += ` AND ${isMember}`; countSql += ` AND ${isMember}`;
      params.push(auth.userId, auth.userId);
      countParams.push(auth.userId, auth.userId);
    }
  }

  if (status) { sql += ' AND p.status = ?'; countSql += ' AND p.status = ?'; params.push(status); countParams.push(status); }
  if (client_id) { sql += ' AND p.client_id = ?'; countSql += ' AND p.client_id = ?'; params.push(client_id); countParams.push(client_id); }

  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  logger.debug(`findAllRepo SQL: ${sql} params=${JSON.stringify(params)}`);
  const [rows] = await db.query(sql, params);
  const [[{ total }]] = await db.query(countSql, countParams);
  logger.debug(`findAllRepo result: rows=${rows.length} total=${total}`);
  return { rows, total };
};
