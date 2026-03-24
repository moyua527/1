const db = require('../../../config/db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  try {
    const { type, target, code, new_password } = req.body;
    if (!type || !target || !code || !new_password) return res.status(400).json({ success: false, message: '参数缺失' });
    if (new_password.length < 6) return res.status(400).json({ success: false, message: '密码至少6个字符' });

    const [vcRows] = await db.query(
      'SELECT id FROM verification_codes WHERE type = ? AND target = ? AND code = ? AND expires_at > NOW() AND used = 0 ORDER BY created_at DESC LIMIT 1',
      [type, target, code]
    );
    if (vcRows.length === 0) return res.status(400).json({ success: false, message: '验证码无效或已过期' });

    await db.query('UPDATE verification_codes SET used = 1 WHERE id = ?', [vcRows[0].id]);

    const col = type === 'phone' ? 'phone' : 'email';
    const hashed = await bcrypt.hash(new_password, 10);
    const [result] = await db.query(`UPDATE voice_users SET password = ? WHERE ${col} = ? AND is_active = 1`, [hashed, target]);

    if (result.affectedRows === 0) return res.status(400).json({ success: false, message: '用户不存在或未激活' });

    res.json({ success: true, message: '密码重置成功，请使用新密码登录' });
  } catch (e) {
    console.error('[resetPassword error]', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
