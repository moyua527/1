const updateProject = require('../../services/project/updateProject');
const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    const role = req.userRole;
    const uid = req.userId;
    const pid = req.params.id;

    if (role !== 'admin') {
      const perms = await getProjectPerms(uid, pid);
      if (!perms || !perms.can_edit_project) return res.status(403).json({ success: false, message: '无权编辑此项目' });
    }

    await updateProject(pid, req.body);
    broadcast('project', 'updated', { id: pid, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
