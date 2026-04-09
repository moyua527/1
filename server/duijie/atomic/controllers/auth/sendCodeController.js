const logger = require('../../../config/logger');
const { sendVerificationCode } = require('../../../config/mailer');
const { storeVerificationCode, checkCooldown } = require('../../../config/redis');

module.exports = async (req, res) => {
  try {
    const { type, target } = req.body;
    if (!type || !target) return res.status(400).json({ success: false, message: '参数缺失' });
    if (type !== 'phone' && type !== 'email') return res.status(400).json({ success: false, message: '无效的验证码类型' });

    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      return res.status(400).json({ success: false, message: '邮箱格式无效' });
    }
    if (type === 'phone' && !/^\d{11}$/.test(target)) {
      return res.status(400).json({ success: false, message: '手机号格式无效' });
    }

    const cooldown = await checkCooldown(type, target);
    if (cooldown > 0) {
      return res.status(429).json({ success: false, message: `请${cooldown}秒后再试` });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    await storeVerificationCode(type, target, code, 300);

    if (type === 'email') {
      const sent = await sendVerificationCode(target, code, '登录');
      if (!sent) logger.warn(`邮件发送失败，验证码仍已存储: ${target}`);
    } else {
      logger.info(`短信验证码（SMS 未集成）: ${target} -> ${code}`);
    }

    res.json({ success: true, message: '验证码已发送', ...(process.env.NODE_ENV !== 'production' ? { _dev_code: code } : {}) });
  } catch (e) {
    logger.error(`sendCode: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
