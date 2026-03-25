const db = require('../../../config/db');
const { notify } = require('../../utils/notify');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: '请选择用户' });

    const [[project]] = await db.query('SELECT client_id, name FROM duijie_projects WHERE id = ? AND is_deleted = 0', [id]);
    if (!project || !project.client_id) return res.status(400).json({ success: false, message: '项目未关联企业' });

    const isAdmin = req.userRole === 'admin';
    if (!isAdmin) {
      const [[membership]] = await db.query(
        "SELECT role FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND is_deleted = 0 AND role IN ('creator','admin')",
        [project.client_id, req.userId]
      );
      if (!membership) return res.status(403).json({ success: false, message: '仅企业管理员可添加客户方成员' });
    }

    const [[isMember]] = await db.query(
      'SELECT 1 FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND is_deleted = 0',
      [project.client_id, user_id]
    );
    if (!isMember) return res.status(400).json({ success: false, message: '该用户不属于客户企业' });

    const [[existing]] = await db.query(
      'SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ?', [id, user_id]
    );
    if (existing) return res.status(400).json({ success: false, message: '该用户已是项目成员' });

    await db.query(
      "INSERT INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, 'viewer', 'client')",
      [id, user_id]
    );

    if (user_id !== req.userId) {
      await notify(user_id, 'project_member', '项目邀请', `你被添加为项目「${project.name}」的客户方成员`, `/projects/${id}`);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
