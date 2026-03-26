const db = require('../../../config/db');

module.exports = async (id) => {
  const [rows] = await db.query(
    'SELECT p.*, c.name as client_name, c.company as client_company FROM duijie_projects p LEFT JOIN duijie_clients c ON p.client_id = c.id WHERE p.id = ? AND p.is_deleted = 0',
    [id]
  );
  if (!rows[0]) return null;
  const [members] = await db.query(
    `SELECT pm.id as pm_id, pm.role as member_role, pm.source, pm.enterprise_role_id,
            er.name as enterprise_role_name, er.color as enterprise_role_color,
            u.id, u.username, u.nickname, u.avatar
     FROM duijie_project_members pm
     INNER JOIN voice_users u ON pm.user_id = u.id
     LEFT JOIN enterprise_roles er ON er.id = pm.enterprise_role_id AND er.is_deleted = 0
     WHERE pm.project_id = ? AND u.is_deleted = 0 ORDER BY pm.source ASC, pm.role DESC`,
    [id]
  );
  return { ...rows[0], members };
};
