const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { buildUserPayload, signAccessToken, signTwoFactorChallenge } = require('../../utils/authToken');

module.exports = async (req, res) => {
  try {
    const { type, target, code } = req.body;
    if (!type || !target || !code) return res.status(400).json({ success: false, message: '参数缺失' });

    // Verify code
    const [codes] = await db.query(
      'SELECT id FROM verification_codes WHERE type = ? AND target = ? AND code = ? AND expires_at > NOW() AND used = 0 ORDER BY created_at DESC LIMIT 1',
      [type, target, code]
    );
    if (codes.length === 0) {
      return res.status(400).json({ success: false, message: '验证码错误或已过期' });
    }

    // Mark code as used
    await db.query('UPDATE verification_codes SET used = 1 WHERE id = ?', [codes[0].id]);

    // Find user by phone or email
    const field = type === 'phone' ? 'phone' : 'email';
    const [users] = await db.query(
      `SELECT id, username, nickname, avatar, role, client_id, is_active, totp_enabled, totp_secret FROM voice_users WHERE ${field} = ? AND is_deleted = 0`,
      [target]
    );
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: '未找到关联账号，请先注册' });
    }
    const user = users[0];
    if (!user.is_active) {
      return res.json({ success: false, message: '账号已被禁用' });
    }

    if (user.totp_enabled === 1 && user.totp_secret) {
      const challengeToken = await signTwoFactorChallenge(user);
      return res.json({ success: true, require_2fa: true, challenge_token: challengeToken, data: buildUserPayload(user) });
    }

    const token = await signAccessToken(user);
    await db.query('UPDATE voice_users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      data: buildUserPayload(user),
      token,
    });
  } catch (e) {
    logger.error(`loginByCode: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
