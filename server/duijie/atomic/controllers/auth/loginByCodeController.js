const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { buildUserPayload, signAccessToken, createRefreshToken, parseDeviceName } = require('../../utils/authToken');
const { notify } = require('../../utils/notify');

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
      `SELECT id, username, nickname, avatar, role, client_id, is_active FROM voice_users WHERE ${field} = ? AND is_deleted = 0`,
      [target]
    );
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: '未找到关联账号，请先注册' });
    }
    const user = users[0];
    if (!user.is_active) {
      return res.json({ success: false, message: '账号已被禁用' });
    }

    const deviceInfo = { userAgent: req.headers['user-agent'], ip: req.ip };
    const token = await signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id, deviceInfo);
    db.query('UPDATE voice_users SET last_login_at = NOW() WHERE id = ?', [user.id]).catch((err) => {
      logger.error(`loginByCode.lastLogin: ${err.message}`);
    });
    // 安全事件通知
    const devName = parseDeviceName(req.headers['user-agent']);
    notify(user.id, 'security', '新设备登录提醒', `你的账号刚刚在 ${devName} 上通过验证码登录（IP: ${req.ip}）。如非本人操作，请立即修改密码。`).catch(() => {});
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000 });
    res.cookie('refresh_token', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });

    res.json({
      success: true,
      data: buildUserPayload(user),
      token,
      refresh_token: refreshToken,
    });
  } catch (e) {
    logger.error(`loginByCode: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
