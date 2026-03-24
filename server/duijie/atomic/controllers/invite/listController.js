const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, c.nickname as creator_name, c.username as creator_username,
       u.nickname as used_by_name, u.username as used_by_username
       FROM duijie_invite_links l
       LEFT JOIN voice_users c ON l.created_by = c.id
       LEFT JOIN voice_users u ON l.used_by = u.id
       ORDER BY l.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
