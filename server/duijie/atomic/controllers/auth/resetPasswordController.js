const db = require('../../../config/db');
const bcrypt = require('bcryptjs');
const logger = require('../../../config/logger');
const { revokeAllUserTokens } = require('../../utils/authToken');
const { notify } = require('../../utils/notify');

module.exports = async (req, res) => {
  try {
    const { type, target, code, new_password } = req.body;
    if (!type || !target || !code || !new_password) return res.status(400).json({ success: false, message: '参数缺失' });
    if (new_password.length < 8) return res.status(400).json({ success: false, message: '密码至少8个字符' });
    if (!/[a-zA-Z]/.test(new_password) || !/[0-9]/.test(new_password)) {
      return res.status(400).json({ success: false, message: '密码必须包含字母和数字' });
    }

    const [vcRows] = await db.query(
      'SELECT id FROM verification_codes WHERE type = ? AND target = ? AND code = ? AND expires_at > NOW() AND used = 0 ORDER BY created_at DESC LIMIT 1',
      [type, target, code]
    );
    if (vcRows.length === 0) return res.status(400).json({ success: false, message: '验证码无效或已过期' });

    await db.query('UPDATE verification_codes SET used = 1 WHERE id = ?', [vcRows[0].id]);

    const col = type === 'phone' ? 'phone' : 'email';
    const hashed = await bcrypt.hash(new_password, 10);

    // 查找用户ID用于撤销token和通知
    const [users] = await db.query(`SELECT id FROM voice_users WHERE ${col} = ? AND is_active = 1`, [target]);
    const [result] = await db.query(`UPDATE voice_users SET password = ? WHERE ${col} = ? AND is_active = 1`, [hashed, target]);

    if (result.affectedRows === 0) return res.status(400).json({ success: false, message: '用户不存在或未激活' });

    // 撤销所有token + 通知
    if (users.length > 0) {
      const userId = users[0].id;
      await revokeAllUserTokens(userId);
      notify(userId, 'security', '密码已重置', '你的账号密码已通过找回密码功能重置。所有设备已下线。').catch(() => {});
    }

    res.json({ success: true, message: '密码重置成功，请使用新密码登录' });
  } catch (e) {
    logger.error(`resetPassword: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
