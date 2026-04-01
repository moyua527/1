const db = require('../../../config/db');
const { notify } = require('../../utils/notify');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role, enterprise_role_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: '请选择用户' });
    const validRoles = ['owner', 'editor', 'viewer'];
    const memberRole = validRoles.includes(role) ? role : 'editor';

    // 获取项目的我方企业ID
    const [[project]] = await db.query(
      'SELECT internal_client_id, name FROM duijie_projects WHERE id = ? AND is_deleted = 0', [id]
    );
    if (!project) return res.status(404).json({ success: false, message: '项目不存在' });

    // 如果项目关联了我方企业，验证被添加用户必须是该企业成员
    if (project.internal_client_id) {
      const [[isMember]] = await db.query(
        'SELECT 1 FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND is_deleted = 0',
        [project.internal_client_id, user_id]
      );
      if (!isMember) return res.status(400).json({ success: false, message: '该用户不属于项目关联的我方企业' });
    }

    const [[existing]] = await db.query(
      'SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ?', [id, user_id]
    );
    if (existing) return res.status(400).json({ success: false, message: '该用户已是项目成员' });

    await db.query(
      "INSERT INTO duijie_project_members (project_id, user_id, role, source, enterprise_role_id) VALUES (?, ?, ?, 'internal', ?)",
      [id, user_id, memberRole, enterprise_role_id || null]
    );
    if (user_id !== req.userId) {
      await notify(user_id, 'project_member', '项目邀请', `你被添加为项目「${project.name}」的成员`, `/projects/${id}`);
    }
    broadcast('project', 'member_added', { id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
