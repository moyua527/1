const { getProjectPerms } = require('../../utils/projectPerms');
const { PROJECT_ROLE_FIELDS } = require('../../utils/projectRoles');

module.exports = async (req, res) => {
  try {
    const perms = await getProjectPerms(req.userId, req.params.id);
    if (!perms) {
      if (req.userRole === 'admin') {
        const adminPerms = { projectRole: 'admin', source: 'platform', enterpriseRoleId: null, can_create_project: true };
        PROJECT_ROLE_FIELDS.forEach(f => { adminPerms[f] = true; });
        return res.json({ success: true, data: adminPerms });
      }
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: perms });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
