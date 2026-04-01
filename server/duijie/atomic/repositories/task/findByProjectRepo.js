const db = require('../../../config/db');

module.exports = async (project_id, auth = {}) => {
  const base = `SELECT t.*, u.nickname as assignee_name, u.username as assignee_username,
    cr.nickname as creator_name, cr.username as creator_username,
    p.name as project_name
    FROM duijie_tasks t
    LEFT JOIN voice_users u ON u.id = t.assignee_id
    LEFT JOIN voice_users cr ON cr.id = t.created_by
    LEFT JOIN duijie_projects p ON p.id = t.project_id`;
  if (project_id) {
    const [rows] = await db.query(
      `${base} WHERE t.project_id = ? AND t.is_deleted = 0 ORDER BY t.sort_order ASC, t.created_at DESC`,
      [project_id]
    );
    return rows;
  }
  let filter = '';
  const params = [];
  if (auth.role === 'member' && auth.userId) {
    filter = 'AND t.project_id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ? UNION SELECT id FROM duijie_projects WHERE created_by = ? AND is_deleted = 0)';
    params.push(auth.userId, auth.userId);
  }
  // 企业数据隔离
  if (auth.activeEnterpriseId) {
    filter += ' AND t.project_id IN (SELECT id FROM duijie_projects WHERE is_deleted = 0 AND (internal_client_id = ? OR client_id = ?))';
    params.push(auth.activeEnterpriseId, auth.activeEnterpriseId);
  }
  const [rows] = await db.query(
    `${base} WHERE t.is_deleted = 0 ${filter} ORDER BY t.sort_order ASC, t.created_at DESC`,
    params
  );
  return rows;
};
