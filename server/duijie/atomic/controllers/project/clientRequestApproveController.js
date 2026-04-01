const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { getUserActiveEnterpriseId, normalizeProjectClientId } = require('../../services/accessScope');

// POST /api/projects/client-requests/:id/approve
module.exports = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.userId;
    const activeEntId = await getUserActiveEnterpriseId(userId);

    // 查找请求
    const [[request]] = await db.query(
      'SELECT * FROM duijie_project_client_requests WHERE id = ? AND status = ?',
      [requestId, 'pending']
    );
    if (!request) return res.status(404).json({ success: false, message: '请求不存在或已处理' });

    // 验证当前用户属于目标企业
    if (!activeEntId || Number(activeEntId) !== Number(request.to_enterprise_id)) {
      return res.status(403).json({ success: false, message: '只有目标企业成员才能审批' });
    }

    // 验证项目仍然存在
    const [[project]] = await db.query(
      'SELECT id, internal_client_id, client_id FROM duijie_projects WHERE id = ? AND is_deleted = 0',
      [request.project_id]
    );
    if (!project) {
      await db.query('UPDATE duijie_project_client_requests SET status = ?, handled_by = ?, handled_at = NOW() WHERE id = ?', ['rejected', userId, requestId]);
      return res.status(404).json({ success: false, message: '项目已不存在' });
    }

    // 更新请求状态
    await db.query(
      'UPDATE duijie_project_client_requests SET status = ?, handled_by = ?, handled_at = NOW() WHERE id = ?',
      ['approved', userId, requestId]
    );

    // 关联客户企业到项目
    const normalizedClientId = await normalizeProjectClientId(request.to_enterprise_id, project.internal_client_id);
    await db.query(
      'UPDATE duijie_projects SET client_id = ? WHERE id = ?',
      [normalizedClientId || request.to_enterprise_id, request.project_id]
    );

    logger.info(`client-request-approve: request=${requestId} project=${request.project_id} by=${userId}`);
    res.json({ success: true, message: '已同意关联请求' });
  } catch (e) {
    logger.error(`client-request-approve: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
