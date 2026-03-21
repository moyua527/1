const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    if (username.length < 3) return res.status(400).json({ success: false, message: '用户名至少3个字符' });
    if (password.length < 6) return res.status(400).json({ success: false, message: '密码至少6个字符' });
    const [existing] = await db.query('SELECT id FROM voice_users WHERE username = ? AND is_deleted = 0', [username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '用户名已存在' });
    const displayName = (nickname || username).trim();
    const [result] = await db.query(
      'INSERT INTO voice_users (username, password, nickname, role) VALUES (?, ?, ?, ?)',
      [username.trim(), password, displayName, 'member']
    );
    res.json({ success: true, data: { id: result.insertId, username: username.trim(), nickname: displayName, role: 'member' } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
