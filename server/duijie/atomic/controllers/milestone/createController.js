const createMilestone = require('../../services/milestone/createMilestone');
const { broadcast } = require('../../utils/broadcast');
const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      const perms = await getProjectPerms(req.userId, req.body.project_id);
      if (!perms?.can_create_milestone) return res.status(403).json({ success: false, message: '无代办创建权限' });
    }
    const id = await createMilestone({ ...req.body, created_by: req.userId });
    broadcast('milestone', 'created', { project_id: req.body.project_id, userId: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    console.error('milestone create error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
