const db = require('../../../config/db');
const bcrypt = require('bcryptjs');
const generateDisplayId = require('../../utils/generateDisplayId');
const generateInviteCode = require('../../utils/generateInviteCode');

module.exports = async (req, res) => {
  try {
    const { email, phone, verify_code, invite_token } = req.body;
    if (!email && !phone) return res.status(400).json({ success: false, message: '请提供手机号或邮箱' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: '邮箱格式无效' });
    if (phone && !/^\d{11}$/.test(phone)) return res.status(400).json({ success: false, message: '手机号格式无效' });
    if (!verify_code) return res.status(400).json({ success: false, message: '请输入验证码' });

    // 验证码校验
    const vcType = phone ? 'phone' : 'email';
    const vcTarget = phone || email;
    const [vcRows] = await db.query(
      'SELECT id FROM verification_codes WHERE type = ? AND target = ? AND code = ? AND expires_at > NOW() AND used = 0 ORDER BY created_at DESC LIMIT 1',
      [vcType, vcTarget, verify_code]
    );
    if (vcRows.length === 0) return res.status(400).json({ success: false, message: '验证码无效或已过期' });
    await db.query('UPDATE verification_codes SET used = 1 WHERE id = ?', [vcRows[0].id]);

    // 检查是否已注册
    const checkField = phone ? 'phone' : 'email';
    const checkValue = phone || email;
    const [existing] = await db.query(`SELECT id FROM voice_users WHERE ${checkField} = ? AND is_deleted = 0`, [checkValue]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: phone ? '该手机号已注册' : '该邮箱已注册' });

    // 自动生成用户信息
    const username = phone || email.split('@')[0] + '_' + Date.now().toString(36);
    const nickname = phone ? '用户' + phone.slice(-4) : email.split('@')[0];
    const defaultPwd = '123456';
    const displayId = await generateDisplayId('000000', 0);
    const personalCode = await generateInviteCode();

    let assignedRole = 'member';
    let isActive = 1;
    let inviterId = null;

    // 邀请链接注册（可选）
    if (invite_token) {
      const [linkRows] = await db.query(
        'SELECT * FROM duijie_invite_links WHERE token = ? AND used_by IS NULL AND (expires_at IS NULL OR expires_at > NOW())',
        [invite_token.trim()]
      );
      if (linkRows.length > 0) {
        inviterId = linkRows[0].created_by;
        await db.query('UPDATE duijie_invite_links SET used_by = ?, used_at = NOW() WHERE id = ?', [null, linkRows[0].id]);
      }
    }

    const [result] = await db.query(
      'INSERT INTO voice_users (username, password, nickname, email, phone, role, display_id, personal_invite_code, invited_by, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, await bcrypt.hash(defaultPwd, 10), nickname, email || null, phone || null, assignedRole, displayId, personalCode, inviterId, isActive]
    );
    const newUserId = result.insertId;

    // 邀请链接标记已使用
    if (invite_token) {
      await db.query('UPDATE duijie_invite_links SET used_by = ? WHERE token = ? AND used_by IS NULL', [newUserId, invite_token.trim()]);
    }

    // 注册成功自动登录
    const jwt = require('jsonwebtoken');
    const getJwtSecret = require('../../repositories/auth/getJwtSecretRepo');
    const secret = await getJwtSecret();
    const token = jwt.sign({ userId: newUserId, role: assignedRole, clientId: null }, secret, { expiresIn: '7d' });
    await db.query('UPDATE voice_users SET last_login_at = NOW() WHERE id = ?', [newUserId]);

    res.json({
      success: true,
      message: '注册成功！',
      token,
      data: { id: newUserId, display_id: displayId, username, nickname, role: assignedRole }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
