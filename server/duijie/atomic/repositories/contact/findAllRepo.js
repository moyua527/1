const db = require('../../../config/db');

module.exports = async (auth = {}) => {
  let filter = '';
  const params = [];
  if (auth.activeEnterpriseId) {
    filter = `AND c.client_id IN (
      SELECT DISTINCT CASE WHEN p.client_id = ? THEN p.internal_client_id ELSE p.client_id END
      FROM duijie_projects p WHERE p.is_deleted = 0 AND (p.internal_client_id = ? OR p.client_id = ?)
      UNION SELECT ?
    )`;
    params.push(auth.activeEnterpriseId, auth.activeEnterpriseId, auth.activeEnterpriseId, auth.activeEnterpriseId);
  }
  const [rows] = await db.query(
    `SELECT c.*, cl.name as client_name
     FROM duijie_contacts c
     LEFT JOIN duijie_clients cl ON c.client_id = cl.id
     WHERE 1=1 ${filter}
     ORDER BY c.created_at DESC`,
    params
  );
  return rows;
};
