const db = require('../../../config/db');
const { rotateRefreshToken, signAccessToken } = require('../../utils/authToken');

module.exports = async (req, res) => {
  try {
    const rawToken = req.cookies?.refresh_token || req.body?.refresh_token;
    if (!rawToken) return res.status(401).json({ success: false, message: '无刷新令牌' });

    const deviceInfo = { userAgent: req.headers['user-agent'], ip: req.ip };
    const result = await rotateRefreshToken(rawToken, deviceInfo);
    if (!result) return res.status(401).json({ success: false, message: '刷新令牌无效或已过期，请重新登录' });

    // 查询用户信息用于签发新 access token
    const [[user]] = await db.query(
      'SELECT id, role, client_id FROM voice_users WHERE id = ? AND is_deleted = 0 AND is_active = 1 LIMIT 1',
      [result.userId]
    );
    if (!user) return res.status(401).json({ success: false, message: '用户不存在或已被禁用' });

    const newAccessToken = await signAccessToken(user);

    // 更新 cookies
    res.cookie('token', newAccessToken, { httpOnly: true, sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000 });
    res.cookie('refresh_token', result.newRefreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });

    res.json({ success: true, token: newAccessToken, refresh_token: result.newRefreshToken });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
