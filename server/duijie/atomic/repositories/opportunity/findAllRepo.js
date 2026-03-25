const db = require('../../../config/db');

module.exports = async (userId, userRole) => {
  let filter = '';
  const params = [];
  if (userRole === 'business') {
    filter = 'AND (o.assigned_to = ? OR o.created_by = ?)';
    params.push(userId, userId);
  }
  const [rows] = await db.query(
    `SELECT o.*, c.name as client_name, a.nickname as assigned_name
     FROM duijie_opportunities o
     LEFT JOIN duijie_clients c ON c.id = o.client_id
     LEFT JOIN voice_users a ON a.id = o.assigned_to
     WHERE o.is_deleted = 0 ${filter}
     ORDER BY o.created_at DESC`,
    params
  );
  return rows;
};
