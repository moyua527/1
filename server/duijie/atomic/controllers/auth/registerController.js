const db = require('../../../config/db');
const generateDisplayId = require('../../utils/generateDisplayId');
const generateInviteCode = require('../../utils/generateInviteCode');

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
    if (!invite_code) return res.status(400).json({ success: false, message: '请输入邀请码' });

    // 先查个人邀请码
    let inviterId = null;
    const [personalRows] = await db.query(
      'SELECT id FROM voice_users WHERE personal_invite_code = ? AND is_deleted = 0', [invite_code.trim().toUpperCase()]
    );
    if (personalRows.length > 0) {
      inviterId = personalRows[0].id;
    } else {
      // 再查系统邀请码
      const [codeRows] = await db.query("SELECT config_value FROM system_config WHERE config_key = 'INVITE_CODE'");
      if (codeRows.length === 0 || !codeRows[0].config_value || invite_code.trim() !== codeRows[0].config_value) {
        return res.status(400).json({ success: false, message: '邀请码无效' });
      }
    }

    const [existing] = await db.query('SELECT id FROM voice_users WHERE username = ? AND is_deleted = 0', [username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '用户名已存在' });
    const displayName = (nickname || username).trim();
    const displayId = await generateDisplayId(area_code, Number(gender));
    const personalCode = await generateInviteCode();
    const [result] = await db.query(
      'INSERT INTO voice_users (username, password, nickname, email, phone, role, gender, area_code, display_id, personal_invite_code, invited_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username.trim(), password, displayName, email || null, phone || null, 'member', Number(gender), area_code, displayId, personalCode, inviterId]
    );
    const newUserId = result.insertId;

    // 如果是通过个人邀请码注册，自动将新用户添加为邀请人的客户
    if (inviterId) {
      await db.query(
        'INSERT INTO duijie_clients (user_id, name, email, phone, channel, stage, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newUserId, displayName, email || null, phone || null, '邀请注册', 'potential', inviterId]
      );
    }

    res.json({ success: true, data: { id: newUserId, display_id: displayId, username: username.trim(), nickname: displayName, role: 'member' } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
