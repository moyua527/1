const db = require('../../../config/db');

module.exports = async (msgId) => {
  const [[msg]] = await db.query(
    'SELECT id, sender_id, created_at FROM duijie_direct_messages WHERE id = ?',
    [msgId]
  );
  return msg || null;
};
