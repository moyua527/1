const db = require('../../../config/db');
const crypto = require('crypto');

module.exports = async (req, res) => {
  try {
    const { preset_role, expires_hours, note } = req.body;
    const validRoles = ['admin', 'tech', 'business', 'member'];
    if (preset_role && !validRoles.includes(preset_role)) {
      return res.status(400).json({ success: false, message: '角色无效' });
    }
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = expires_hours ? new Date(Date.now() + expires_hours * 3600000) : null;
    const [result] = await db.query(
      'INSERT INTO duijie_invite_links (token, preset_role, created_by, expires_at, note) VALUES (?, ?, ?, ?, ?)',
      [token, preset_role || 'member', req.user.userId, expiresAt, note || null]
    );
    res.json({ success: true, data: { id: result.insertId, token, preset_role: preset_role || 'member', expires_at: expiresAt } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
