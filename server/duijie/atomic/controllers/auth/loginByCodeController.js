const jwt = require('jsonwebtoken');
const db = require('../../../config/db');

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

    // Generate JWT
    const [secretRows] = await db.query("SELECT config_value FROM system_config WHERE config_key = 'JWT_SECRET'");
    const secret = secretRows[0]?.config_value;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const token = jwt.sign({ userId: user.id, role: user.role, clientId: user.client_id || null }, secret, { expiresIn: '7d' });

    res.json({
      success: true,
      data: { id: user.id, username: user.username, nickname: user.nickname, avatar: user.avatar, role: user.role, client_id: user.client_id || null },
      token,
    });
  } catch (e) {
    console.error('[loginByCode error]', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
