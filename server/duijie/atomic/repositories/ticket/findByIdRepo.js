const db = require('../../../config/db');

module.exports = async (ticketId) => {
  const [[ticket]] = await db.query(
    `SELECT t.*, u1.nickname as creator_name, u1.username as creator_username,
      u2.nickname as assignee_name, u2.username as assignee_username,
      p.name as project_name
     FROM duijie_tickets t
     LEFT JOIN voice_users u1 ON t.created_by = u1.id
     LEFT JOIN voice_users u2 ON t.assigned_to = u2.id
     LEFT JOIN duijie_projects p ON t.project_id = p.id
     WHERE t.id = ? AND t.is_deleted = 0`, [ticketId]
  );
  return ticket || null;
};
