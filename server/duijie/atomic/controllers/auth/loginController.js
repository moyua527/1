const loginService = require('../../services/auth/loginService');
const { notify } = require('../../utils/notify');

module.exports = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    const deviceInfo = { userAgent: req.headers['user-agent'], ip: req.ip };
    const result = await loginService(username, password, deviceInfo);
    if (!result) return res.status(401).json({ success: false, message: '用户名或密码错误' });
    if (result.disabled) return res.status(403).json({ success: false, message: '账号已被禁用，请联系管理员' });
    // 安全事件通知：新设备登录
    const { parseDeviceName } = require('../../utils/authToken');
    const devName = parseDeviceName(req.headers['user-agent']);
    notify(result.user.id, 'security', '新设备登录提醒', `你的账号刚刚在 ${devName} 上登录（IP: ${req.ip}）。如非本人操作，请立即修改密码。`).catch(() => {});
    // access token cookie (2小时)
    res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax', maxAge: 2 * 60 * 60 * 1000 });
    // refresh token cookie (30天, HTTP-Only, 仅 /api/auth/refresh 路径)
    res.cookie('refresh_token', result.refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });
    res.json({ success: true, data: result.user, token: result.token, refresh_token: result.refreshToken });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
