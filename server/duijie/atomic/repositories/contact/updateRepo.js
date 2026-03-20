const db = require('../../../config/db');

module.exports = async (id, fields) => {
  const keys = Object.keys(fields).filter(k => ['name', 'position', 'phone', 'email', 'wechat', 'is_primary', 'notes'].includes(k));
  if (keys.length === 0) return;
  const sets = keys.map(k => `${k} = ?`).join(', ');
  const vals = keys.map(k => fields[k]);
  await db.query(`UPDATE duijie_contacts SET ${sets} WHERE id = ?`, [...vals, id]);
};
