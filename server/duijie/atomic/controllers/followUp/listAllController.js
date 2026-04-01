const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    let filter = '';
    const params = [];
    if (req.activeEnterpriseId) {
      filter = `AND f.client_id IN (
        SELECT DISTINCT CASE WHEN p.client_id = ? THEN p.internal_client_id ELSE p.client_id END
        FROM duijie_projects p WHERE p.is_deleted = 0 AND (p.internal_client_id = ? OR p.client_id = ?)
        UNION SELECT ?
      )`;
      params.push(req.activeEnterpriseId, req.activeEnterpriseId, req.activeEnterpriseId, req.activeEnterpriseId);
    }
    const [rows] = await db.query(
      `SELECT f.*, c.name as client_name
       FROM duijie_follow_ups f
       LEFT JOIN duijie_clients c ON f.client_id = c.id
       WHERE f.next_follow_date IS NOT NULL ${filter}
       ORDER BY f.next_follow_date DESC
       LIMIT 200`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
