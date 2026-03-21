const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, nickname, avatar, role, client_id, display_id, gender, area_code, created_at FROM voice_users WHERE is_deleted = 0 ORDER BY id'
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
