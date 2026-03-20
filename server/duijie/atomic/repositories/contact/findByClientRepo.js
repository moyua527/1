const db = require('../../../config/db');

module.exports = async (clientId) => {
  const [rows] = await db.query(
    'SELECT * FROM duijie_contacts WHERE client_id = ? ORDER BY is_primary DESC, created_at ASC',
    [clientId]
  );
  return rows;
};
