const db = require('../../../config/db');
const generateDisplayId = require('../../utils/generateDisplayId');

module.exports = async (req, res) => {
  try {
    const { username, password, nickname, email, phone, invite_code, gender, area_code } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    if (username.length < 3) return res.status(400).json({ success: false, message: '用户名至少3个字符' });
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ success: false, message: '用户名仅支持字母、数字和下划线' });
    if (password.length < 6) return res.status(400).json({ success: false, message: '密码至少6个字符' });
    if (!email && !phone) return res.status(400).json({ success: false, message: '邮箱和手机号至少填写一项' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: '邮箱格式无效' });
    if (!gender || ![1, 2].includes(Number(gender))) return res.status(400).json({ success: false, message: '请选择性别' });
    if (!area_code || !/^\d{6}$/.test(area_code)) return res.status(400).json({ success: false, message: '请选择所在地区' });
    const [codeRows] = await db.query("SELECT config_value FROM system_config WHERE config_key = 'INVITE_CODE'");
    if (codeRows.length > 0 && codeRows[0].config_value) {
      if (!invite_code) return res.status(400).json({ success: false, message: '请输入邀请码' });
      if (invite_code !== codeRows[0].config_value) return res.status(400).json({ success: false, message: '邀请码无效' });
    }
    const [existing] = await db.query('SELECT id FROM voice_users WHERE username = ? AND is_deleted = 0', [username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '用户名已存在' });
    const displayName = (nickname || username).trim();
    const displayId = await generateDisplayId(area_code, Number(gender));
    const [result] = await db.query(
      'INSERT INTO voice_users (username, password, nickname, email, phone, role, gender, area_code, display_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username.trim(), password, displayName, email || null, phone || null, 'member', Number(gender), area_code, displayId]
    );
    res.json({ success: true, data: { id: result.insertId, display_id: displayId, username: username.trim(), nickname: displayName, role: 'member' } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
