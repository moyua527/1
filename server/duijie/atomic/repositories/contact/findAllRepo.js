const db = require('../../../config/db');

module.exports = async () => {
  const [rows] = await db.query(
    `SELECT c.*, cl.company_name as client_name
     FROM duijie_contacts c
     LEFT JOIN duijie_clients cl ON c.client_id = cl.id
     ORDER BY c.created_at DESC`
  );
  return rows;
};
