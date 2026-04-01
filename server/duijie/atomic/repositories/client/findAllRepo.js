const db = require('../../../config/db');

module.exports = async (auth = {}) => {
  let filter = '';
  const params = [];
  if (auth.excludeEnterpriseId) {
    filter += ' AND c.id != ?';
    params.push(auth.excludeEnterpriseId);
  }
  if (auth.role !== 'admin' && auth.userId) {
    // 企业数据隔离：只显示当前活跃企业关联的项目中的客户
    if (auth.activeEnterpriseId) {
      filter += ` AND c.id IN (
        SELECT DISTINCT CASE WHEN p.client_id = ? THEN p.internal_client_id ELSE p.client_id END
        FROM duijie_projects p
        WHERE p.is_deleted = 0 AND (p.internal_client_id = ? OR p.client_id = ?)
      )`;
      params.push(auth.activeEnterpriseId, auth.activeEnterpriseId, auth.activeEnterpriseId);
    } else {
      filter += ` AND c.id IN (
        SELECT DISTINCT p.client_id FROM duijie_projects p
        WHERE p.is_deleted = 0 AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))
      )`;
      params.push(auth.userId, auth.userId);
    }
  }
  const [rows] = await db.query(
    `SELECT c.*,
     a.nickname as assigned_name, a.username as assigned_username,
     (SELECT COUNT(*) FROM duijie_projects p WHERE p.client_id = c.id AND p.is_deleted = 0) as project_count,
     (SELECT GROUP_CONCAT(t.name, ':', t.color SEPARATOR '|') FROM duijie_client_tags ct INNER JOIN duijie_tags t ON t.id = ct.tag_id WHERE ct.client_id = c.id) as tags_str
     FROM duijie_clients c
     LEFT JOIN voice_users a ON a.id = c.assigned_to
     WHERE c.is_deleted = 0 ${filter} ORDER BY c.created_at DESC`,
    params
  );
  return rows.map(r => ({
    ...r,
    tags: r.tags_str ? r.tags_str.split('|').map(s => { const [name, color] = s.split(':'); return { name, color }; }) : [],
  }));
};
