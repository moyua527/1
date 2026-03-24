const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const uid = req.userId;
    const otherId = req.params.userId;
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
    // Mark as read
    await db.query(
      'UPDATE duijie_direct_messages SET read_at = NOW() WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL',
      [otherId, uid]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
