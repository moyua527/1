const logger = require('../../../config/logger');
const redis = require('../../../config/redis');

module.exports = async (req, res) => {
  try {
    const { type, target, code } = req.body;
    if (!type || !target || !code) return res.status(400).json({ success: false, message: '参数缺失' });
    if (type !== 'phone' && type !== 'email') return res.status(400).json({ success: false, message: '无效的验证码类型' });

    const stored = await redis.get(`vc:${type}:${target}`);
    if (!stored || stored !== code) return res.status(400).json({ success: false, message: '验证码无效或已过期' });

    res.json({ success: true, message: '验证成功' });
  } catch (e) {
    logger.error(`verifyCode: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
