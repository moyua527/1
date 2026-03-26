const db = require('../../../config/db');
const logger = require('../../../config/logger');

module.exports = async ({ status, client_id, page = 1, limit = 20 }, auth = {}) => {
  let sql = 'SELECT p.*, c.name as client_name, c.company as client_company, ic.name as internal_client_name, ic.company as internal_client_company FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id LEFT JOIN duijie_clients ic ON p.internal_client_id = ic.id WHERE p.is_deleted = 0';
  let countSql = 'SELECT COUNT(*) as total FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id LEFT JOIN duijie_clients ic ON p.internal_client_id = ic.id WHERE p.is_deleted = 0';
  const params = [];
  const countParams = [];

  const isMember = '(p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';

  if (auth.role === 'admin') {
    // 全部可见
  } else if (auth.userId) {
    // 企业端用户 JWT 带 clientId：可见本企业（客户）下全部项目，否则仅参与的项目
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
