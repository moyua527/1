const db = require('../../../config/db');
const bcrypt = require('bcryptjs');
const cache = require('../../utils/memoryCache');

module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const { nickname, email, phone, username, gender, position, department, employee_no, code } = req.body;
    const fields = [];
    const values = [];
    if (position !== undefined) { fields.push('position = ?'); values.push(position || null); }
    if (department !== undefined) { fields.push('department = ?'); values.push(department || null); }
    if (employee_no !== undefined) { fields.push('employee_no = ?'); values.push(employee_no || null); }
    if (gender !== undefined) {
      const g = gender === null ? null : Number(gender);
      if (g !== null && g !== 1 && g !== 2) return res.status(400).json({ success: false, message: '性别值无效' });
      fields.push('gender = ?'); values.push(g);
    }
    if (username !== undefined) {
      const uname = username.trim();
      if (!/^[a-zA-Z0-9]{3,20}$/.test(uname)) return res.status(400).json({ success: false, message: '用户名只能包含英文和数字，3~20个字符' });
      const [dup] = await db.query('SELECT id FROM voice_users WHERE username = ? AND id != ? AND is_deleted = 0', [uname, userId]);
      if (dup.length > 0) return res.status(400).json({ success: false, message: '该用户名已被占用' });
      fields.push('username = ?'); values.push(uname);
    }
    if (nickname !== undefined) {
      const nn = (nickname || '').trim().slice(0, 6);
      if (nn.length > 0 && nn.length < 2) return res.status(400).json({ success: false, message: '昵称需要2~6个字符' });
      fields.push('nickname = ?'); values.push(nn || null);
    }

    if (phone !== undefined && phone) {
      if (!code) return res.status(400).json({ success: false, message: '修改手机号需要验证码' });
      const { verifyCode } = require('../../../config/redis');
      const valid = await verifyCode('phone', phone, code);
      if (!valid) return res.status(400).json({ success: false, message: '验证码无效或已过期' });
      fields.push('phone = ?'); values.push(phone);
    } else if (phone !== undefined) {
      fields.push('phone = ?'); values.push(null);
    }

    if (email !== undefined && email) {
      if (!code) return res.status(400).json({ success: false, message: '修改邮箱需要验证码' });
      const { verifyCode } = require('../../../config/redis');
      const valid = await verifyCode('email', email, code);
      if (!valid) return res.status(400).json({ success: false, message: '验证码无效或已过期' });
      fields.push('email = ?'); values.push(email);
    } else if (email !== undefined) {
      fields.push('email = ?'); values.push(null);
    }
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
    const [rows] = await db.query('SELECT id, username, nickname, email, phone, avatar, role, gender, position, department, employee_no, display_id, personal_invite_code, client_id, guide_done, created_at FROM voice_users WHERE id = ?', [userId]);
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
