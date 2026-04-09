const validateInvite = require('../../services/invite/validateInvite');

module.exports = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await validateInvite(token);
    if (!invite) return res.json({ success: false, message: '邀请链接无效或已过期' });
    res.json({
      success: true,
      data: {
        preset_role: 'member',
        inviter_name: invite.inviter_name || null,
        inviter_avatar: invite.inviter_avatar || null,
        created_at: invite.created_at || null,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
