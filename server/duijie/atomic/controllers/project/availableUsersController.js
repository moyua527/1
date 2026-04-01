const db = require('../../../config/db');
const { getUserActiveEnterpriseId } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    const [[project]] = await db.query(
      'SELECT internal_client_id FROM duijie_projects WHERE id = ? AND is_deleted = 0', [id]
    );
    if (!project) return res.json({ success: true, data: [] });

    // 确定企业ID：优先用项目关联的我方企业，否则用当前用户的活跃企业
    const enterpriseId = project.internal_client_id || await getUserActiveEnterpriseId(req.userId);
    if (!enterpriseId) return res.json({ success: true, data: [] });

    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nickname, u.role, cm.name as member_name, cm.position
       FROM duijie_client_members cm
       INNER JOIN voice_users u ON u.id = cm.user_id
       WHERE cm.client_id = ? AND cm.is_deleted = 0 AND u.is_deleted = 0 AND u.is_active = 1
       AND u.id NOT IN (SELECT user_id FROM duijie_project_members WHERE project_id = ?)
       ORDER BY cm.name, u.nickname`,
      [enterpriseId, id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
