const db = require('../../../config/db');

module.exports = async (id) => {
  const [rows] = await db.query(
    'SELECT p.*, c.name as client_name, c.company as client_company FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id WHERE p.id = ? AND p.is_deleted = 0',
    [id]
  );
  if (!rows[0]) return null;
  const [members] = await db.query(
    `SELECT pm.role as member_role, u.id, u.username, u.nickname, u.avatar
     FROM duijie_project_members pm INNER JOIN voice_users u ON pm.user_id = u.id
     WHERE pm.project_id = ? AND u.is_deleted = 0 ORDER BY pm.role DESC`,
    [id]
  );
  return { ...rows[0], members };
};
