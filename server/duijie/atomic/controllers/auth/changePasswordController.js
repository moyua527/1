const db = require('../../../config/db');
const bcrypt = require('bcryptjs');
const logger = require('../../../config/logger');
const { revokeAllUserTokens } = require('../../utils/authToken');
const { notify } = require('../../utils/notify');

module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const { code, new_password, currentPassword, newPassword } = req.body;

    const finalNewPassword = newPassword || new_password;
    if (!finalNewPassword) return res.status(400).json({ success: false, message: '请输入新密码' });
    if (finalNewPassword.length < 8) return res.status(400).json({ success: false, message: '密码至少8个字符' });
    if (!/^[a-zA-Z0-9]+$/.test(finalNewPassword)) {
      return res.status(400).json({ success: false, message: '密码只能包含英文和数字' });
    }

    const [users] = await db.query('SELECT password, phone, email FROM voice_users WHERE id = ? AND is_active = 1', [userId]);
    if (users.length === 0) return res.status(400).json({ success: false, message: '用户不存在' });
    const user = users[0];

    if (currentPassword) {
      if (!user.password) return res.status(400).json({ success: false, message: '当前账号未设置密码，请通过验证码修改' });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ success: false, message: '当前密码错误' });
      const sameAsOld = await bcrypt.compare(finalNewPassword, user.password);
      if (sameAsOld) return res.status(400).json({ success: false, message: '新密码不能与旧密码相同' });
      logger.info(`用户 ${userId} 通过旧密码验证修改密码`);
    } else if (code) {
      if (!user.phone && !user.email) return res.status(400).json({ success: false, message: '请先绑定手机号或邮箱后再修改密码' });
      const verifyType = user.phone ? 'phone' : 'email';
      const verifyTarget = user.phone || user.email;
      const { verifyCode } = require('../../../config/redis');
      const valid = await verifyCode(verifyType, verifyTarget, code);
      if (!valid) return res.status(400).json({ success: false, message: '验证码无效或已过期' });
      logger.info(`用户 ${userId} 通过${verifyType === 'phone' ? '手机' : '邮箱'}验证修改密码`);
    } else {
      return res.status(400).json({ success: false, message: '请输入当前密码或验证码' });
    }

    const hashed = await bcrypt.hash(finalNewPassword, 10);
    await db.query('UPDATE voice_users SET password = ? WHERE id = ?', [hashed, userId]);

    await revokeAllUserTokens(userId);

    notify(userId, 'security', '密码已修改', '你的账号密码刚刚被修改。所有设备已下线，如非本人操作，请立即联系管理员。').catch(() => {});

    res.json({ success: true, message: '密码修改成功，所有设备已下线' });
  } catch (e) {
    logger.error(`changePassword: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
