const db = require('../../../config/db');

module.exports = async (ticketId, content, createdBy) => {
  const [r] = await db.query(
    'INSERT INTO duijie_ticket_replies (ticket_id, content, created_by) VALUES (?,?,?)',
    [ticketId, content || '', createdBy]
  );
  return r.insertId;
};
