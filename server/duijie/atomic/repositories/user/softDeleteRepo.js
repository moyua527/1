const db = require('../../../config/db');

module.exports = async (id) => {
  await db.query('UPDATE voice_users SET is_deleted = 1 WHERE id = ?', [id]);
};
