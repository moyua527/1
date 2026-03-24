const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const uid = req.userId;
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nickname, u.role,
        (SELECT content FROM duijie_direct_messages m
         WHERE ((m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id))
         AND m.is_deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM duijie_direct_messages m
         WHERE ((m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id))
         AND m.is_deleted = 0 ORDER BY m.created_at DESC LIMIT 1) as last_time,
        (SELECT COUNT(*) FROM duijie_direct_messages m
         WHERE m.sender_id = u.id AND m.receiver_id = ? AND m.read_at IS NULL AND m.is_deleted = 0) as unread_count
       FROM voice_users u
       WHERE u.id != ? AND u.is_deleted = 0
       HAVING last_message IS NOT NULL
       ORDER BY last_time DESC`,
      [uid, uid, uid, uid, uid, uid]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
