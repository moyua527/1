const db = require('../../../config/db');
const { notify } = require('../../utils/notify');
const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.userRole !== 'admin') {
      const perms = await getProjectPerms(req.userId, id);
      if (!perms || !perms.can_manage_members) return res.status(403).json({ success: false, message: '无权管理项目成员' });
    }
    const { user_id, role, enterprise_role_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: '请选择用户' });
    const validRoles = ['owner', 'editor', 'viewer'];
    const memberRole = validRoles.includes(role) ? role : 'editor';

    const [[existing]] = await db.query(
      'SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ?', [id, user_id]
    );
    if (existing) return res.status(400).json({ success: false, message: '该用户已是项目成员' });

    await db.query(
      "INSERT INTO duijie_project_members (project_id, user_id, role, source, enterprise_role_id) VALUES (?, ?, ?, 'internal', ?)",
      [id, user_id, memberRole, enterprise_role_id || null]
    );
    const [[project]] = await db.query('SELECT name FROM duijie_projects WHERE id = ?', [id]);
    if (user_id !== req.userId) {
      await notify(user_id, 'project_member', '项目邀请', `你被添加为项目「${project?.name || '#' + id}」的成员`, `/projects/${id}`);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
