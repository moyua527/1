const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nickname, u.email, u.phone, u.display_id, u.personal_invite_code
       FROM voice_users u
       WHERE u.role = 'member' AND u.is_deleted = 0
       AND u.id NOT IN (SELECT user_id FROM duijie_clients WHERE user_id IS NOT NULL AND is_deleted = 0)
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
