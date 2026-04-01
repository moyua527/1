const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取项目的我方企业ID
    const [[project]] = await db.query(
      'SELECT internal_client_id FROM duijie_projects WHERE id = ? AND is_deleted = 0', [id]
    );
    if (!project) return res.json({ success: true, data: [] });

    // 如果项目关联了我方企业，只返回该企业的成员(排除已加入者)
    if (project.internal_client_id) {
      const [rows] = await db.query(
        `SELECT u.id, u.username, u.nickname, u.role, cm.name as member_name, cm.position
         FROM duijie_client_members cm
         INNER JOIN voice_users u ON u.id = cm.user_id
         WHERE cm.client_id = ? AND cm.is_deleted = 0 AND u.is_deleted = 0 AND u.is_active = 1
         AND u.id NOT IN (SELECT user_id FROM duijie_project_members WHERE project_id = ?)
         ORDER BY cm.name, u.nickname`,
        [project.internal_client_id, id]
      );
      return res.json({ success: true, data: rows });
    }

    // 无关联企业时，返回所有平台用户(向后兼容)
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nickname, u.role FROM voice_users u
       WHERE u.is_deleted = 0 AND u.is_active = 1
       AND u.id NOT IN (SELECT user_id FROM duijie_project_members WHERE project_id = ?)
       ORDER BY u.nickname, u.username`,
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
