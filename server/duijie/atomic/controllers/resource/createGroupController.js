const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    const { project_id, name, visibility, visible_users } = req.body;
    if (!project_id || !name?.trim()) return res.status(400).json({ success: false, message: '请输入资料名称' });
    if (req.userRole !== 'admin') {
      const perms = await getProjectPerms(req.userId, project_id);
      if (!perms?.can_manage_resource_group) return res.status(403).json({ success: false, message: '无资源分组管理权限' });
    }

    const [result] = await db.query(
      'INSERT INTO duijie_resource_groups (project_id, name, visibility, created_by) VALUES (?, ?, ?, ?)',
      [project_id, name.trim(), visibility === 'selected' ? 'selected' : 'all', req.userId]
    );
    const groupId = result.insertId;

    if (visibility === 'selected' && Array.isArray(visible_users) && visible_users.length > 0) {
      const vals = visible_users.map(uid => [groupId, uid]);
      await db.query('INSERT INTO duijie_resource_group_visibility (group_id, user_id) VALUES ?', [vals]);
    }

    broadcast('file', 'created', { project_id, userId: req.userId });
    res.json({ success: true, data: { id: groupId } });
  } catch (e) {
    console.error('createGroup error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
