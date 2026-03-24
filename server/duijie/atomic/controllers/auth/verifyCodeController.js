const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { type, target, code } = req.body;
    if (!type || !target || !code) return res.status(400).json({ success: false, message: '参数缺失' });
    if (type !== 'phone' && type !== 'email') return res.status(400).json({ success: false, message: '无效的验证码类型' });

    const [rows] = await db.query(
      'SELECT id FROM verification_codes WHERE type = ? AND target = ? AND code = ? AND expires_at > NOW() AND used = 0 ORDER BY created_at DESC LIMIT 1',
      [type, target, code]
    );
    if (rows.length === 0) return res.status(400).json({ success: false, message: '验证码无效或已过期' });

    res.json({ success: true, message: '验证成功' });
  } catch (e) {
    console.error('[verifyCode error]', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
