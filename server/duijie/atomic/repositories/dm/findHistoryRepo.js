const db = require('../../../config/db');

module.exports = async (uid, otherId) => {
  const [rows] = await db.query(
    `SELECT m.*, s.nickname as sender_name, s.username as sender_username
     FROM duijie_direct_messages m
     LEFT JOIN voice_users s ON s.id = m.sender_id
     WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
     AND m.is_deleted = 0
     ORDER BY m.created_at ASC
     LIMIT 200`,
    [uid, otherId, otherId, uid]
  );
  return rows;
};
