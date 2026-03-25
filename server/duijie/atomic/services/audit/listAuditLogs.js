const findAllRepo = require('../../repositories/audit/findAllRepo');

module.exports = async ({ action, entity_type, user_id, start_date, end_date, keyword, page, limit }) => {
  const offset = (page - 1) * limit;
  let where = '1=1';
  const params = [];
  if (action) { where += ' AND a.action = ?'; params.push(action); }
  if (entity_type) { where += ' AND a.entity_type = ?'; params.push(entity_type); }
  if (user_id) { where += ' AND a.user_id = ?'; params.push(user_id); }
  if (start_date) { where += ' AND a.created_at >= ?'; params.push(start_date); }
  if (end_date) { where += ' AND a.created_at <= ?'; params.push(end_date + ' 23:59:59'); }
  if (keyword) {
    where += ' AND (a.detail LIKE ? OR u.nickname LIKE ? OR u.username LIKE ? OR a.ip LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw, kw);
  }
  const { rows, total } = await findAllRepo(where, params, limit, offset);
  return { logs: rows, total, page, limit };
};
