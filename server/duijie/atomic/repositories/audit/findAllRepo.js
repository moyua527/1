const db = require('../../../config/db');

module.exports = async (where, params, limit, offset) => {
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM duijie_audit_logs a LEFT JOIN voice_users u ON a.user_id = u.id WHERE ${where}`, params
  );
  const [rows] = await db.query(
    `SELECT a.*, u.nickname, u.username FROM duijie_audit_logs a LEFT JOIN voice_users u ON a.user_id = u.id WHERE ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return { rows, total };
};
