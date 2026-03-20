const db = require('../../../config/db');

module.exports = async (id) => {
  await db.query('DELETE FROM duijie_client_tags WHERE tag_id = ?', [id]);
  await db.query('DELETE FROM duijie_tags WHERE id = ?', [id]);
};
