const db = require('../../../config/db');

module.exports = async ({ client_id, title, amount, status, signed_date, expire_date, notes, created_by }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_contracts (client_id, title, amount, status, signed_date, expire_date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [client_id, title, amount || 0, status || 'draft', signed_date || null, expire_date || null, notes, created_by]
  );
  return result.insertId;
};
