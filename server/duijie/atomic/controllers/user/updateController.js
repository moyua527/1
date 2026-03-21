const db = require('../../../config/db');

const VALID_ROLES = ['admin', 'sales_manager', 'business', 'marketing', 'tech', 'support', 'member', 'viewer', 'client'];

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, role, client_id, manager_id, password, is_active } = req.body;
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: '角色无效' });
    }

    const fields = [];
    const values = [];
    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (client_id !== undefined) { fields.push('client_id = ?'); values.push(client_id || null); }
    if (manager_id !== undefined) { fields.push('manager_id = ?'); values.push(manager_id || null); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (password) { fields.push('password = ?'); values.push(password); }

    if (fields.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });

    values.push(id);
    await db.query(`UPDATE voice_users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
