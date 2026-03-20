const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { username, password, nickname, role, client_id } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: '用户名和密码必填' });
    if (!['admin', 'member', 'client'].includes(role)) return res.status(400).json({ success: false, message: '角色无效' });
    if (role === 'client' && !client_id) return res.status(400).json({ success: false, message: '客户角色必须关联客户' });

    const [existing] = await db.query('SELECT id FROM voice_users WHERE username = ? AND is_deleted = 0', [username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '用户名已存在' });

    const [result] = await db.query(
      'INSERT INTO voice_users (username, password, nickname, role, client_id) VALUES (?, ?, ?, ?, ?)',
      [username, password, nickname || username, role, role === 'client' ? client_id : null]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
