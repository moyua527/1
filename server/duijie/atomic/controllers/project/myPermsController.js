const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    const perms = await getProjectPerms(req.userId, req.params.id);
    if (!perms) {
      if (req.userRole === 'admin') {
        return res.json({ success: true, data: {
          projectRole: 'admin', source: 'platform', enterpriseRoleId: null,
          can_manage_members: true, can_manage_roles: true,
          can_create_project: true, can_edit_project: true, can_delete_project: true,
          can_manage_client: true, can_view_report: true, can_manage_task: true,
        }});
      }
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: perms });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
