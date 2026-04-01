const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { getUserActiveEnterpriseId } = require('../../services/accessScope');

// POST /api/projects/client-requests/:id/reject
module.exports = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.userId;
    const { reason } = req.body;
    const activeEntId = await getUserActiveEnterpriseId(userId);

    const [[request]] = await db.query(
      'SELECT * FROM duijie_project_client_requests WHERE id = ? AND status = ?',
      [requestId, 'pending']
    );
    if (!request) return res.status(404).json({ success: false, message: '请求不存在或已处理' });

    if (!activeEntId || Number(activeEntId) !== Number(request.to_enterprise_id)) {
      return res.status(403).json({ success: false, message: '只有目标企业成员才能审批' });
    }

    await db.query(
      'UPDATE duijie_project_client_requests SET status = ?, handled_by = ?, handled_at = NOW(), reject_reason = ? WHERE id = ?',
      ['rejected', userId, reason || null, requestId]
    );

    logger.info(`client-request-reject: request=${requestId} project=${request.project_id} by=${userId}`);
    res.json({ success: true, message: '已拒绝关联请求' });
  } catch (e) {
    logger.error(`client-request-reject: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
