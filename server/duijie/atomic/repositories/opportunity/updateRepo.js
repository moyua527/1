const db = require('../../../config/db');

module.exports = async (id, fields) => {
  const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
  if (keys.length === 0) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => fields[k]);
  await db.query(`UPDATE duijie_opportunities SET ${sets} WHERE id = ? AND is_deleted = 0`, [...vals, id]);
};
