const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { getUserActiveEnterpriseId } = require('../../services/accessScope');

// GET /api/projects/client-requests/sent
// 获取当前企业发出的项目关联请求
module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const activeEntId = await getUserActiveEnterpriseId(userId);

    if (!activeEntId) {
      return res.json({ success: true, data: [] });
    }

    const [rows] = await db.query(
      `SELECT r.id, r.project_id, r.from_enterprise_id, r.to_enterprise_id,
              r.status, r.message, r.reject_reason, r.created_at, r.handled_at,
              p.name as project_name,
              fe.name as from_enterprise_name,
              te.name as to_enterprise_name,
              u.nickname as requested_by_name
       FROM duijie_project_client_requests r
       LEFT JOIN duijie_projects p ON p.id = r.project_id
       LEFT JOIN duijie_clients fe ON fe.id = r.from_enterprise_id
       LEFT JOIN duijie_clients te ON te.id = r.to_enterprise_id
       LEFT JOIN voice_users u ON u.id = r.requested_by
       WHERE r.from_enterprise_id = ?
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [activeEntId]
    );

    res.json({ success: true, data: rows });
  } catch (e) {
    logger.error(`client-requests-sent: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
