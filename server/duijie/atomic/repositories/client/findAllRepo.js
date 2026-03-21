const db = require('../../../config/db');
const getSubordinateIds = require('../../utils/getSubordinateIds');

module.exports = async (auth = {}) => {
  let filter = '';
  const params = [];
  if (auth.role === 'sales_manager' && auth.userId) {
    const teamIds = await getSubordinateIds(auth.userId);
    filter = `AND (c.assigned_to IN (${teamIds.map(() => '?').join(',')}) OR c.created_by IN (${teamIds.map(() => '?').join(',')}))`;
    params.push(...teamIds, ...teamIds);
  } else if (auth.role === 'business' && auth.userId) {
    filter = `AND (c.assigned_to = ? OR c.created_by = ?)`;
    params.push(auth.userId, auth.userId);
  } else if (auth.role === 'marketing') {
    filter = `AND c.stage IN ('potential', 'intent')`;
  } else if (auth.role === 'support') {
    filter = `AND c.stage IN ('signed', 'active')`;
  } else if (auth.role === 'member' && auth.userId) {
    filter = `AND c.id IN (
      SELECT DISTINCT p.client_id FROM duijie_projects p
      WHERE p.is_deleted = 0 AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))
    )`;
    params.push(auth.userId, auth.userId);
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
