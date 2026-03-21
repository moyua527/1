const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const { nickname, password } = req.body;
    const fields = [];
    const values = [];
    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
    if (password) { fields.push('password = ?'); values.push(password); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    values.push(userId);
    await db.query(`UPDATE voice_users SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT id, username, nickname, avatar, role, client_id FROM voice_users WHERE id = ?', [userId]);
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
