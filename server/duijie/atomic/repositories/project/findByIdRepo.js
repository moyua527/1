const db = require('../../../config/db');

module.exports = async (id) => {
  const [rows] = await db.query(
    'SELECT p.*, c.name as client_name, c.company as client_company FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id WHERE p.id = ? AND p.is_deleted = 0',
    [id]
  );
  return rows[0] || null;
};
