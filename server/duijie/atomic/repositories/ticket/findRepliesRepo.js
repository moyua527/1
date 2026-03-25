const db = require('../../../config/db');

module.exports = async (ticketId) => {
  const [rows] = await db.query(
    `SELECT r.*, u.nickname as creator_name, u.username as creator_username, u.role as creator_role
     FROM duijie_ticket_replies r LEFT JOIN voice_users u ON r.created_by = u.id
     WHERE r.ticket_id = ? AND r.is_deleted = 0 ORDER BY r.created_at ASC`, [ticketId]
  );
  return rows;
};
