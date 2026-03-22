const db = require('../../../config/db');
const bcrypt = require('bcryptjs');
const generateDisplayId = require('../../utils/generateDisplayId');
const generateInviteCode = require('../../utils/generateInviteCode');

module.exports = async (req, res) => {
  try {
    const { username, password, nickname, email, phone, invite_code, invite_token, gender, area_code } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    if (username.length < 3) return res.status(400).json({ success: false, message: '用户名至少3个字符' });
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ success: false, message: '用户名仅支持字母、数字和下划线' });
    if (password.length < 6) return res.status(400).json({ success: false, message: '密码至少6个字符' });
    if (!email && !phone) return res.status(400).json({ success: false, message: '邮箱和手机号至少填写一项' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: '邮箱格式无效' });
    if (!gender || ![1, 2].includes(Number(gender))) return res.status(400).json({ success: false, message: '请选择性别' });
    if (!area_code || !/^\d{6}$/.test(area_code)) return res.status(400).json({ success: false, message: '请选择所在地区' });

    let inviterId = null;
    let assignedRole = 'member';
    let isActive = 0; // 默认需审批
    let regChannel = '系统邀请码';
    let inviteLinkId = null;

    // 方式1: 邀请链接注册（优先级最高）
    if (invite_token) {
      const [linkRows] = await db.query(
        'SELECT * FROM duijie_invite_links WHERE token = ? AND used_by IS NULL AND (expires_at IS NULL OR expires_at > NOW())',
        [invite_token.trim()]
      );
      if (linkRows.length === 0) return res.status(400).json({ success: false, message: '邀请链接无效或已过期' });
      const link = linkRows[0];
      assignedRole = link.preset_role || 'member';
      isActive = 1; // 邀请链接直接激活
      inviterId = link.created_by;
      inviteLinkId = link.id;
      regChannel = '邀请链接';
    } else {
      // 方式2/3: 邀请码注册
      if (!invite_code) return res.status(400).json({ success: false, message: '请输入邀请码' });

      // 先查个人邀请码
      const [personalRows] = await db.query(
        'SELECT id FROM voice_users WHERE personal_invite_code = ? AND is_deleted = 0', [invite_code.trim().toUpperCase()]
      );
      if (personalRows.length > 0) {
        // 方式2: 个人邀请码 → 客户角色，直接激活
        inviterId = personalRows[0].id;
        assignedRole = 'client';
        isActive = 1;
        regChannel = '个人邀请码';
      } else {
        // 方式3: 系统邀请码 → member角色，需审批
        const [codeRows] = await db.query("SELECT config_value FROM system_config WHERE config_key = 'INVITE_CODE'");
        if (codeRows.length === 0 || !codeRows[0].config_value || invite_code.trim() !== codeRows[0].config_value) {
          return res.status(400).json({ success: false, message: '邀请码无效' });
        }
        assignedRole = 'member';
        isActive = 0; // 需管理员审批
        regChannel = '系统邀请码';
      }
    }

    const [existing] = await db.query('SELECT id FROM voice_users WHERE username = ? AND is_deleted = 0', [username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '用户名已存在' });
    const displayName = (nickname || username).trim();
    const displayId = await generateDisplayId(area_code, Number(gender));
    const personalCode = await generateInviteCode();
    const [result] = await db.query(
      'INSERT INTO voice_users (username, password, nickname, email, phone, role, gender, area_code, display_id, personal_invite_code, invited_by, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username.trim(), await bcrypt.hash(password, 10), displayName, email || null, phone || null, assignedRole, Number(gender), area_code, displayId, personalCode, inviterId, isActive]
    );
    const newUserId = result.insertId;

    // 个人邀请码注册 → 自动添加为邀请人的客户
    if (regChannel === '个人邀请码' && inviterId) {
      await db.query(
        'INSERT INTO duijie_clients (user_id, name, email, phone, channel, stage, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newUserId, displayName, email || null, phone || null, '邀请注册', 'potential', inviterId]
      );
    }

    // 邀请链接标记已使用
    if (inviteLinkId) {
      await db.query('UPDATE duijie_invite_links SET used_by = ?, used_at = NOW() WHERE id = ?', [newUserId, inviteLinkId]);
    }

    const needApproval = isActive === 0;
    res.json({
      success: true,
      needApproval,
      message: needApproval ? '注册成功，请等待管理员审批后方可登录' : '注册成功！',
      data: { id: newUserId, display_id: displayId, username: username.trim(), nickname: displayName, role: assignedRole }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
