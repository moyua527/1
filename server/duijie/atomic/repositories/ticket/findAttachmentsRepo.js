const db = require('../../../config/db');

module.exports = async (ticketId) => {
  const [rows] = await db.query(
    'SELECT id, ticket_id, reply_id, filename, original_name, file_size, mime_type, created_by, created_at FROM duijie_ticket_attachments WHERE ticket_id = ?',
    [ticketId]
  );
  return rows;
};
