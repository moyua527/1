const db = require('../../../config/db');
const { withTransaction } = require('../../utils/transaction');
const logger = require('../../../config/logger');
const bcrypt = require('bcryptjs');
const generateDisplayId = require('../../utils/generateDisplayId');
const generateInviteCode = require('../../utils/generateInviteCode');

module.exports = async (req, res) => {
  try {
    const { username: rawUsername, password, nickname: rawNickname, invite_token, email: rawEmail } = req.body;
    if (!rawUsername || !password) return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    const trimUser = rawUsername.trim();
    if (trimUser.length < 2 || trimUser.length > 30) return res.status(400).json({ success: false, message: '用户名长度 2-30 位' });
    if (password.length < 8) return res.status(400).json({ success: false, message: '密码至少8位' });
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: '密码必须包含字母和数字' });
    }

    const email = rawEmail ? rawEmail.trim().toLowerCase() : null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式无效' });
    }

    // 检查用户名是否已存在
    const [existing] = await db.query('SELECT id FROM voice_users WHERE username = ? AND is_deleted = 0', [trimUser]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: '该用户名已被注册' });

    if (email) {
      const [emailExists] = await db.query('SELECT id FROM voice_users WHERE email = ? AND is_deleted = 0', [email]);
      if (emailExists.length > 0) return res.status(400).json({ success: false, message: '该邮箱已被注册' });
    }

    const nickname = (rawNickname || trimUser).slice(0, 50);
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
      }
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    const newUserId = await withTransaction(async (conn) => {
      const [result] = await conn.query(
        'INSERT INTO voice_users (username, password, nickname, email, role, display_id, personal_invite_code, invited_by, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [trimUser, hashedPwd, nickname, email, assignedRole, displayId, personalCode, inviterId, isActive]
      );
      if (invite_token) {
        await conn.query('UPDATE duijie_invite_links SET used_by = ? WHERE token = ? AND used_by IS NULL', [result.insertId, invite_token.trim()]);
      }
      return result.insertId;
    });

    // 注册成功自动登录
    const jwt = require('jsonwebtoken');
    const getJwtSecret = require('../../repositories/auth/getJwtSecretRepo');
    const secret = await getJwtSecret();
    const token = jwt.sign({ userId: newUserId, role: assignedRole, clientId: null }, secret, { expiresIn: '7d' });
    db.query('UPDATE voice_users SET last_login_at = NOW() WHERE id = ?', [newUserId]).catch((err) => {
      logger.error(`register.lastLogin: ${err.message}`);
    });

    res.json({
      success: true,
      message: '注册成功！',
      token,
      data: { id: newUserId, display_id: displayId, username: trimUser, nickname, role: assignedRole }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
