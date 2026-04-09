const db = require('../../../config/db');
const { withTransaction } = require('../../utils/transaction');
const logger = require('../../../config/logger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const generateDisplayId = require('../../utils/generateDisplayId');
const generateInviteCode = require('../../utils/generateInviteCode');

module.exports = async (req, res) => {
  try {
    const { invite_token, email: rawEmail, nickname: rawNickname, password: rawPassword, username: rawUsername } = req.body;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : null;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
    }

    const [emailExists] = await db.query('SELECT id FROM voice_users WHERE email = ? AND is_deleted = 0', [email]);
    if (emailExists.length > 0) return res.status(400).json({ success: false, message: '该邮箱已被注册' });

    let username;
    if (rawUsername && rawUsername.trim()) {
      username = rawUsername.trim();
      if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
        return res.status(400).json({ success: false, message: '用户名只能包含英文和数字，3~20个字符' });
      }
      const [dup] = await db.query('SELECT id FROM voice_users WHERE username = ? AND is_deleted = 0', [username]);
      if (dup.length > 0) return res.status(400).json({ success: false, message: '该用户名已被使用' });
    } else {
      const usernameBase = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) || 'user';
      username = usernameBase;
      let suffix = 1;
      while (true) {
        const [dup] = await db.query('SELECT id FROM voice_users WHERE username = ? AND is_deleted = 0', [username]);
        if (dup.length === 0) break;
        username = usernameBase + suffix++;
      }
    }

    const randomSuffix = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };
    const nickname = rawNickname && rawNickname.trim() ? rawNickname.trim().slice(0, 6) : `用户${randomSuffix()}`;
    const displayId = await generateDisplayId('000000', 0);
    const personalCode = await generateInviteCode();
    if (rawPassword && !/^[a-zA-Z0-9]+$/.test(rawPassword)) {
      return res.status(400).json({ success: false, message: '密码只能包含英文和数字' });
    }
    const plainPwd = rawPassword && rawPassword.length >= 8 ? rawPassword : crypto.randomBytes(32).toString('hex');
    const hashedPwd = await bcrypt.hash(plainPwd, 10);

    let assignedRole = 'member';
    let isActive = 1;
    let inviterId = null;

    if (invite_token) {
      const [linkRows] = await db.query(
        'SELECT * FROM duijie_invite_links WHERE token = ? AND used_by IS NULL AND (expires_at IS NULL OR expires_at > NOW())',
        [invite_token.trim()]
      );
      if (linkRows.length > 0) {
        inviterId = linkRows[0].created_by;
      }
    }

    const newUserId = await withTransaction(async (conn) => {
      const [result] = await conn.query(
        'INSERT INTO voice_users (username, password, nickname, email, role, display_id, personal_invite_code, invited_by, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [username, hashedPwd, nickname, email, assignedRole, displayId, personalCode, inviterId, isActive]
      );
      if (invite_token) {
        await conn.query('UPDATE duijie_invite_links SET used_by = ? WHERE token = ? AND used_by IS NULL', [result.insertId, invite_token.trim()]);
      }
      return result.insertId;
    });

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
      data: { id: newUserId, display_id: displayId, username, nickname, role: assignedRole }
    });
  } catch (e) {
    logger.error(`register error: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
