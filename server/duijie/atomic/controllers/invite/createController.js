const crypto = require('crypto');
const createInvite = require('../../services/invite/createInvite');

module.exports = async (req, res) => {
  try {
    const { preset_role, expires_hours, note } = req.body;
    const validRoles = ['admin', 'member'];
    if (preset_role && !validRoles.includes(preset_role)) {
      return res.status(400).json({ success: false, message: '角色无效' });
    }
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = expires_hours ? new Date(Date.now() + expires_hours * 3600000) : null;
    const role = preset_role || 'member';
    const id = await createInvite({
      token,
      preset_role: role,
      created_by: req.user.userId,
      expires_at: expiresAt,
      note: note || null,
    });
    res.json({ success: true, data: { id, token, preset_role: role, expires_at: expiresAt } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
