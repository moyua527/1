const db = require('../../../config/db');

module.exports = async (id, fields, values) => {
  await db.query(`UPDATE voice_users SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
};
