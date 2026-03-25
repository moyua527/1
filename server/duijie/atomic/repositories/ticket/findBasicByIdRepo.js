const db = require('../../../config/db');

module.exports = async (ticketId) => {
  const [[ticket]] = await db.query(
    'SELECT id, title, created_by, status FROM duijie_tickets WHERE id = ? AND is_deleted = 0',
    [ticketId]
  );
  return ticket || null;
};
