const db = require('../../../config/db');

module.exports = async (ticketId, fields, params) => {
  params.push(ticketId);
  await db.query(`UPDATE duijie_tickets SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`, params);
};
