const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nickname, u.avatar, u.role, u.client_id, u.manager_id, u.display_id, u.gender, u.area_code, u.personal_invite_code, u.invited_by, u.email, u.phone, u.created_at, u.updated_at, u.last_login_at, IFNULL(u.is_active, 1) as is_active,
       m.nickname as manager_name, m.username as manager_username
       FROM voice_users u LEFT JOIN voice_users m ON u.manager_id = m.id
       WHERE u.is_deleted = 0 ORDER BY u.id`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
