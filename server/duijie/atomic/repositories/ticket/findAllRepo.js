const db = require('../../../config/db');

module.exports = async ({ memberUserIds, scopedProjectIds } = {}) => {
  let sql = `SELECT t.*, u1.nickname as creator_name, u1.username as creator_username,
      u2.nickname as assignee_name, u2.username as assignee_username,
      p.name as project_name,
      (SELECT COUNT(*) FROM duijie_ticket_replies r WHERE r.ticket_id = t.id AND r.is_deleted = 0) as reply_count
     FROM duijie_tickets t
     LEFT JOIN voice_users u1 ON t.created_by = u1.id
     LEFT JOIN voice_users u2 ON t.assigned_to = u2.id
     LEFT JOIN duijie_projects p ON t.project_id = p.id
     WHERE t.is_deleted = 0`;
  const params = [];

  if (memberUserIds && scopedProjectIds) {
    const conditions = [];
    if (memberUserIds.length > 0) {
      conditions.push(`t.created_by IN (${memberUserIds.map(() => '?').join(',')})`);
      params.push(...memberUserIds);
    }
    if (scopedProjectIds.length > 0) {
      conditions.push(`t.project_id IN (${scopedProjectIds.map(() => '?').join(',')})`);
      params.push(...scopedProjectIds);
    }
    if (conditions.length > 0) {
      sql += ` AND (${conditions.join(' OR ')})`;
    } else {
      sql += ' AND 1=0';
    }
  }

  sql += ' ORDER BY t.created_at DESC';
  const [rows] = await db.query(sql, params);
  return rows;
};
