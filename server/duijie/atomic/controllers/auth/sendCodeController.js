const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { type, target } = req.body; // type: 'phone' | 'email', target: phone number or email
    if (!type || !target) return res.status(400).json({ success: false, message: '参数缺失' });
    if (type !== 'phone' && type !== 'email') return res.status(400).json({ success: false, message: '无效的验证码类型' });

    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      return res.status(400).json({ success: false, message: '邮箱格式无效' });
    }
    if (type === 'phone' && !/^\d{11}$/.test(target)) {
      return res.status(400).json({ success: false, message: '手机号格式无效' });
    }

    // Rate limit: 60s per target
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

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store in DB (expires in 5 min)
    await db.query(
      'INSERT INTO verification_codes (type, target, code, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))',
      [type, target, code]
    );

    // TODO: integrate actual SMS/email sending service
    console.log(`[验证码] ${type === 'phone' ? '手机' : '邮箱'}: ${target} -> ${code}`);

    // 临时测试模式：将验证码返回前端（上线前需删除 _dev_code 字段）
    res.json({ success: true, message: '验证码已发送', _dev_code: code });
  } catch (e) {
    console.error('[sendCode error]', e);
    res.status(500).json({ success: false, message: e.message });
  }
};
