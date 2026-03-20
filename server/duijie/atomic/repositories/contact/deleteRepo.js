const db = require('../../../config/db');

module.exports = async (id) => {
  await db.query('DELETE FROM duijie_contacts WHERE id = ?', [id]);
};
