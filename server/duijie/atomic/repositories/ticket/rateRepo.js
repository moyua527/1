const db = require('../../../config/db');

module.exports = async (ticketId, rating, ratingComment) => {
  await db.query(
    "UPDATE duijie_tickets SET rating = ?, rating_comment = ?, status = 'closed' WHERE id = ?",
    [rating, ratingComment || '', ticketId]
  );
};
