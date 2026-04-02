const db = require('../../../config/db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const { nickname, email, phone } = req.body;
    const fields = [];
    const values = [];
    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email || null); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone || null); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    values.push(userId);
    await db.query(`UPDATE voice_users SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await db.query('SELECT id, username, nickname, email, phone, avatar, role, client_id, created_at FROM voice_users WHERE id = ?', [userId]);
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
