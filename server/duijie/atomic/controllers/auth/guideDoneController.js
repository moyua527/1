const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    await db.query('UPDATE voice_users SET guide_done = 1 WHERE id = ?', [req.userId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
};
