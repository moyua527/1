const { revokeAllUserTokens } = require('../../utils/authToken');

module.exports = async (req, res) => {
  // 撤销所有 refresh tokens（如果已登录）
  if (req.userId) {
    revokeAllUserTokens(req.userId).catch(() => {});
  }
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax', path: '/api/auth/refresh' });
  res.json({ success: true });
};
