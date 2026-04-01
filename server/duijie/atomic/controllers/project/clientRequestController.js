const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { getUserActiveEnterpriseId, isUserInEnterprise } = require('../../services/accessScope');

// POST /api/projects/:id/client-request
// 发起关联客户企业请求
module.exports = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { to_enterprise_id, message } = req.body;
    const userId = req.userId;

    if (!to_enterprise_id) {
      return res.status(400).json({ success: false, message: '请选择目标企业' });
    }

    // 验证项目存在且用户有权限
    const [[project]] = await db.query(
      'SELECT id, internal_client_id, client_id FROM duijie_projects WHERE id = ? AND is_deleted = 0',
      [projectId]
    );
    if (!project) return res.status(404).json({ success: false, message: '项目不存在' });

    // 验证发起人属于项目的我方企业
    const activeEntId = await getUserActiveEnterpriseId(userId);
    if (!activeEntId || Number(activeEntId) !== Number(project.internal_client_id)) {
      return res.status(403).json({ success: false, message: '只有项目我方企业成员才能发起关联请求' });
    }

    // 验证目标企业存在且是company类型
    const [[targetEnt]] = await db.query(
      'SELECT id, name FROM duijie_clients WHERE id = ? AND client_type = ? AND is_deleted = 0',
      [to_enterprise_id, 'company']
    );
    if (!targetEnt) return res.status(404).json({ success: false, message: '目标企业不存在' });

    // 不能关联自己
    if (Number(to_enterprise_id) === Number(project.internal_client_id)) {
      return res.status(400).json({ success: false, message: '不能关联自己的企业' });
    }

    // 项目已有客户企业
    if (project.client_id && Number(project.client_id) !== Number(project.internal_client_id)) {
      return res.status(400).json({ success: false, message: '项目已有客户企业，请先取消现有关联' });
    }

    // 检查是否已有待处理的请求
    const [[existing]] = await db.query(
      'SELECT id FROM duijie_project_client_requests WHERE project_id = ? AND to_enterprise_id = ? AND status = ?',
      [projectId, to_enterprise_id, 'pending']
    );
    if (existing) {
      return res.status(400).json({ success: false, message: '已有待处理的关联请求' });
    }

    // 创建请求
    await db.query(
      `INSERT INTO duijie_project_client_requests (project_id, from_enterprise_id, to_enterprise_id, requested_by, message)
       VALUES (?, ?, ?, ?, ?)`,
      [projectId, project.internal_client_id, to_enterprise_id, userId, message || null]
    );

    logger.info(`project-client-request: user=${userId} project=${projectId} to=${to_enterprise_id}`);
    res.json({ success: true, message: '关联请求已发送，等待对方审批' });
  } catch (e) {
    logger.error(`project-client-request: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
