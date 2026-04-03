const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { sendVerificationCode } = require('../../../config/mailer');

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

    if (type === 'email') {
      const sent = await sendVerificationCode(target, code, '密码重置');
      if (!sent) logger.warn(`密码重置邮件发送失败，验证码仍已入库: ${target}`);
    } else {
      logger.info(`密码重置短信验证码（SMS 未集成）: ${target} -> ${code}`);
    }

    res.json({ success: true, message: '验证码已发送', ...(process.env.NODE_ENV !== 'production' ? { _dev_code: code } : {}) });
  } catch (e) {
    logger.error(`forgotPassword: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
