const db = require('../../../config/db');

module.exports = async (ticketId, fromStatus, toStatus) => {
  await db.query(
    `UPDATE duijie_tickets SET status = ? WHERE id = ? AND status = ?`,
    [toStatus, ticketId, fromStatus]
  );
};
