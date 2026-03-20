const db = require('../../../config/db');

module.exports = async (clientId) => {
  const [rows] = await db.query(
    'SELECT * FROM duijie_contracts WHERE client_id = ? ORDER BY created_at DESC',
    [clientId]
  );
  return rows;
};
