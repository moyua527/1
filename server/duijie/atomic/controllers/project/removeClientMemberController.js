const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const [[project]] = await db.query('SELECT client_id FROM duijie_projects WHERE id = ? AND is_deleted = 0', [id]);
    if (!project || !project.client_id) return res.status(400).json({ success: false, message: '项目未关联企业' });

    const isAdmin = req.userRole === 'admin';
    if (!isAdmin) {
      const [[membership]] = await db.query(
        "SELECT role FROM duijie_client_members WHERE client_id = ? AND user_id = ? AND is_deleted = 0 AND role IN ('creator','admin')",
        [project.client_id, req.userId]
      );
      if (!membership) return res.status(403).json({ success: false, message: '仅企业管理员可移除客户方成员' });
    }

    await db.query(
      "DELETE FROM duijie_project_members WHERE project_id = ? AND user_id = ? AND source = 'client'",
      [id, userId]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
