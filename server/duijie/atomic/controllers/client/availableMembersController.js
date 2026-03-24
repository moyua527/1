const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nickname, u.email, u.phone, u.display_id, u.personal_invite_code, u.role
       FROM voice_users u
       WHERE u.is_deleted = 0
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
