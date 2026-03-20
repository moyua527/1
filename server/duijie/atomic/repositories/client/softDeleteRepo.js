const db = require('../../../config/db');

module.exports = async (id) => {
  await db.query('UPDATE duijie_clients SET is_deleted = 1 WHERE id = ?', [id]);
};
