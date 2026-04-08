const db = require('../../../config/db');
const bcrypt = require('bcryptjs');
const logger = require('../../../config/logger');
const { revokeAllUserTokens } = require('../../utils/authToken');
const { notify } = require('../../utils/notify');

module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const { code, new_password } = req.body;
    if (!code || !new_password) return res.status(400).json({ success: false, message: '请输入验证码和新密码' });
    if (new_password.length < 8) return res.status(400).json({ success: false, message: '密码至少8个字符' });
    if (!/[a-zA-Z]/.test(new_password) || !/[0-9]/.test(new_password)) {
      return res.status(400).json({ success: false, message: '密码必须包含字母和数字' });
    }

    const [users] = await db.query('SELECT phone, email FROM voice_users WHERE id = ? AND is_active = 1', [userId]);
    if (users.length === 0) return res.status(400).json({ success: false, message: '用户不存在' });
    const { phone, email } = users[0];
    if (!phone && !email) return res.status(400).json({ success: false, message: '请先绑定手机号或邮箱后再修改密码' });

    const verifyType = phone ? 'phone' : 'email';
    const verifyTarget = phone || email;
    const [vcRows] = await db.query(
      'SELECT id FROM verification_codes WHERE type = ? AND target = ? AND code = ? AND expires_at > NOW() AND used = 0 ORDER BY created_at DESC LIMIT 1',
      [verifyType, verifyTarget, code]
    );
    if (vcRows.length === 0) return res.status(400).json({ success: false, message: '验证码无效或已过期' });

    await db.query('UPDATE verification_codes SET used = 1 WHERE id = ?', [vcRows[0].id]);

    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE voice_users SET password = ? WHERE id = ?', [hashed, userId]);

    // 撤销所有 refresh token（强制所有设备重新登录）
    await revokeAllUserTokens(userId);

    // 安全事件通知
    notify(userId, 'security', '密码已修改', '你的账号密码刚刚被修改。所有设备已下线，如非本人操作，请立即联系管理员。').catch(() => {});

    logger.info(`用户 ${userId} 通过${verifyType === 'phone' ? '手机' : '邮箱'}验证修改了密码`);
    res.json({ success: true, message: '密码修改成功，所有设备已下线' });
  } catch (e) {
    logger.error(`changePassword: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
