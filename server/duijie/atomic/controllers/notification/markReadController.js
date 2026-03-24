const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await db.query('UPDATE duijie_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.userId]);
    } else {
      await db.query('UPDATE duijie_notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.userId]);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
