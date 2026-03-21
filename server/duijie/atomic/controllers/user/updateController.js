const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, role, client_id, password } = req.body;
    if (role && !['admin', 'tech', 'business', 'member'].includes(role)) {
      return res.status(400).json({ success: false, message: '角色无效' });
    }

    const fields = [];
    const values = [];
    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (client_id !== undefined) { fields.push('client_id = ?'); values.push(client_id || null); }
    if (password) { fields.push('password = ?'); values.push(password); }

    if (fields.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });

    values.push(id);
    await db.query(`UPDATE voice_users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
