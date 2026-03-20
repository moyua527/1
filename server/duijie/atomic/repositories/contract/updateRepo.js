const db = require('../../../config/db');

module.exports = async (id, fields) => {
  const keys = Object.keys(fields).filter(k => ['title', 'amount', 'status', 'signed_date', 'expire_date', 'notes'].includes(k));
  if (keys.length === 0) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => fields[k]);
  await db.query(`UPDATE duijie_contracts SET ${sets} WHERE id = ?`, [...vals, id]);
};
