const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { getUserActiveEnterpriseId } = require('../../services/accessScope');
const { notify } = require('../../utils/notify');

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

    // 通知发起人请求已被拒绝
    const [[toEnt]] = await db.query('SELECT name FROM duijie_clients WHERE id = ?', [request.to_enterprise_id]);
    const [[proj]] = await db.query('SELECT name FROM duijie_projects WHERE id = ?', [request.project_id]);
    await notify(request.requested_by, 'client_request_rejected', '项目关联请求被拒绝', `企业「${toEnt?.name || ''}」拒绝了项目「${proj?.name || ''}」的关联请求`, '/projects');

    logger.info(`client-request-reject: request=${requestId} project=${request.project_id} by=${userId}`);
    res.json({ success: true, message: '已拒绝关联请求' });
  } catch (e) {
    logger.error(`client-request-reject: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
