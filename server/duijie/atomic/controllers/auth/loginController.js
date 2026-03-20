const loginService = require('../../services/auth/loginService');

module.exports = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    const result = await loginService(username, password);
    if (!result) return res.status(401).json({ success: false, message: '用户名或密码错误' });
    res.cookie('token', result.token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, data: result.user, token: result.token });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
