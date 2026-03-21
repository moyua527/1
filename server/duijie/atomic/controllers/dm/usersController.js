const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, nickname, role FROM voice_users WHERE id != ? AND is_deleted = 0 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
