const db = require('../../../config/db');
const bcrypt = require('bcryptjs');
const cache = require('../../utils/memoryCache');

module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const { nickname, email, phone } = req.body;
    const fields = [];
    const values = [];
    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email || null); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone || null); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    values.push(userId);
    await db.query(`UPDATE voice_users SET ${fields.join(', ')} WHERE id = ?`, values);
    // 同步更新企业成员表中的名称/手机/邮箱
    const memberFields = [];
    const memberValues = [];
    if (nickname !== undefined) { memberFields.push('name = ?'); memberValues.push(nickname); }
    if (phone !== undefined) { memberFields.push('phone = ?'); memberValues.push(phone || null); }
    if (email !== undefined) { memberFields.push('email = ?'); memberValues.push(email || null); }
    if (memberFields.length > 0) {
      memberValues.push(userId);
      await db.query(`UPDATE duijie_client_members SET ${memberFields.join(', ')} WHERE user_id = ? AND is_deleted = 0`, memberValues);
      // 广播企业数据变更，让其他在线成员实时刷新
      const { broadcast } = require('../../utils/broadcast');
      broadcast('enterprise', 'member_profile_updated', { user_id: userId });
    }
    cache.del(`user:${userId}`);
    const [rows] = await db.query('SELECT id, username, nickname, email, phone, avatar, role, client_id, created_at FROM voice_users WHERE id = ?', [userId]);
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
