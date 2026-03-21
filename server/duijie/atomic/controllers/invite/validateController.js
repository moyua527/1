const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { token } = req.params;
    const [rows] = await db.query(
      'SELECT id, preset_role, expires_at FROM duijie_invite_links WHERE token = ? AND used_by IS NULL AND (expires_at IS NULL OR expires_at > NOW())',
      [token]
    );
    if (rows.length === 0) return res.json({ success: false, message: '邀请链接无效或已过期' });
    res.json({ success: true, data: { preset_role: rows[0].preset_role } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
