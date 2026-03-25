const db = require('../../../config/db');

module.exports = async ({ ticket_id, reply_id, filename, original_name, file_size, mime_type, created_by }) => {
  await db.query(
    'INSERT INTO duijie_ticket_attachments (ticket_id, reply_id, filename, original_name, file_size, mime_type, created_by) VALUES (?,?,?,?,?,?,?)',
    [ticket_id, reply_id, filename, original_name, file_size, mime_type, created_by]
  );
};
