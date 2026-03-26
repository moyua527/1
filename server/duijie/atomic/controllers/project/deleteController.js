const deleteProject = require('../../services/project/deleteProject');
const { broadcast } = require('../../utils/broadcast');
const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      const perms = await getProjectPerms(req.userId, req.params.id);
      if (!perms || !perms.can_delete_project) return res.status(403).json({ success: false, message: '无权删除此项目' });
    }
    await deleteProject(req.params.id);
    broadcast('project', 'deleted', { id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
