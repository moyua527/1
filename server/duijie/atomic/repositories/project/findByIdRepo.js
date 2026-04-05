const db = require('../../../config/db');
const { normalizeTaskTitlePresets } = require('../../utils/taskTitlePresets');

module.exports = async (id) => {
  const [rows] = await db.query(
    `SELECT p.*, 
            c.name as client_name, c.company as client_company, c.user_id as client_owner_user_id,
            ic.name as internal_client_name, ic.company as internal_client_company, ic.user_id as internal_client_owner_user_id,
            cu.nickname as creator_name, cu.username as creator_username, cu.avatar as creator_avatar
     FROM duijie_projects p
     LEFT JOIN duijie_clients c ON p.client_id = c.id
     LEFT JOIN duijie_clients ic ON p.internal_client_id = ic.id
     LEFT JOIN voice_users cu ON p.created_by = cu.id
     WHERE p.id = ? AND p.is_deleted = 0`,
    [id]
  );
  if (!rows[0]) return null;
  const [members] = await db.query(
    `SELECT pm.id as pm_id, pm.user_id, pm.role as member_role, pm.source, pm.enterprise_role_id, pm.project_role_id,
            pm.nickname as project_nickname,
            er.name as enterprise_role_name, er.color as enterprise_role_color,
            pr.name as project_role_name, pr.color as project_role_color, pr.role_key as project_role_key,
            u.id, u.username, u.nickname, u.avatar
     FROM duijie_project_members pm
     INNER JOIN voice_users u ON pm.user_id = u.id
     LEFT JOIN enterprise_roles er ON er.id = pm.enterprise_role_id AND er.is_deleted = 0
     LEFT JOIN project_roles pr ON pr.id = pm.project_role_id AND pr.is_deleted = 0
     WHERE pm.project_id = ? AND u.is_deleted = 0 ORDER BY pm.source ASC, pm.role DESC`,
    [id]
  );
  return { ...rows[0], task_title_presets: normalizeTaskTitlePresets(rows[0].task_title_presets), members };
};
