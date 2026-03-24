const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, username, nickname, role FROM voice_users
       WHERE is_deleted = 0 AND is_active = 1 AND role != 'client'
       ORDER BY nickname, username`
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
