const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { type, target } = req.body;
    if (!type || !target) return res.status(400).json({ success: false, message: '参数缺失' });
    if (type !== 'phone' && type !== 'email') return res.status(400).json({ success: false, message: '无效类型' });

    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      return res.status(400).json({ success: false, message: '邮箱格式无效' });
    }
    if (type === 'phone' && !/^\d{11}$/.test(target)) {
      return res.status(400).json({ success: false, message: '手机号格式无效' });
    }

    const col = type === 'phone' ? 'phone' : 'email';
    const [users] = await db.query(`SELECT id FROM voice_users WHERE ${col} = ? AND is_active = 1 LIMIT 1`, [target]);
    if (users.length === 0) return res.status(400).json({ success: false, message: '该账号未注册或未激活' });

    const [recent] = await db.query(
      'SELECT created_at FROM verification_codes WHERE target = ? AND type = ? ORDER BY created_at DESC LIMIT 1',
      [target, type]
    );
    if (recent.length > 0) {
      const diff = Date.now() - new Date(recent[0].created_at).getTime();
      if (diff < 60000) {
        return res.status(429).json({ success: false, message: `请${Math.ceil((60000 - diff) / 1000)}秒后再试` });
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await db.query(
      'INSERT INTO verification_codes (type, target, code, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
      [type, target, code]
    );

    console.log(`[重置密码验证码] ${type === 'phone' ? '手机' : '邮箱'}: ${target} -> ${code}`);
    res.json({ success: true, message: '验证码已发送', _dev_code: code });
  } catch (e) {
    console.error('[forgotPassword error]', e);
    res.status(500).json({ success: false, message: e.message });
  }
};
