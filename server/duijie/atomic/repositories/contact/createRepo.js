const db = require('../../../config/db');

module.exports = async ({ client_id, name, position, phone, email, wechat, is_primary, notes, created_by }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_contacts (client_id, name, position, phone, email, wechat, is_primary, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [client_id, name, position, phone, email, wechat, is_primary || 0, notes, created_by]
  );
  return result.insertId;
};
