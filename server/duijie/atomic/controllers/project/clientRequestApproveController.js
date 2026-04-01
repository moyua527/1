const db = require('../../../config/db');
const logger = require('../../../config/logger');
const { getUserActiveEnterpriseId, normalizeProjectClientId } = require('../../services/accessScope');
const { notify, notifyMany } = require('../../utils/notify');
const { broadcast } = require('../../utils/broadcast');

// POST /api/projects/client-requests/:id/approve
module.exports = async (req, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.userId;
    const memberIds = Array.isArray(req.body.member_ids) ? req.body.member_ids.map(Number).filter(n => n > 0) : [];
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

    // 添加选中的对接人员为项目成员
    if (memberIds.length > 0) {
      // 验证这些用户确实属于目标企业
      const [validMembers] = await db.query(
        'SELECT user_id FROM duijie_client_members WHERE client_id = ? AND user_id IN (?) AND is_deleted = 0',
        [request.to_enterprise_id, memberIds]
      );
      const validUserIds = validMembers.map(m => m.user_id);

      for (const uid of validUserIds) {
        // 检查是否已经是项目成员
        const [[existing]] = await db.query(
          'SELECT id FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
          [request.project_id, uid]
        );
        if (!existing) {
          await db.query(
            'INSERT INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, ?, ?)',
            [request.project_id, uid, 'viewer', 'client']
          );
        }
      }

      // 通知被添加的成员
      const [[proj]] = await db.query('SELECT name FROM duijie_projects WHERE id = ?', [request.project_id]);
      if (validUserIds.length > 0) {
        await notifyMany(validUserIds, 'project_member_added', '加入项目', `您已被添加为项目「${proj?.name || ''}」的对接人员`, `/projects/${request.project_id}`);
      }
    }

    // 通知发起人请求已通过
    const [[toEnt]] = await db.query('SELECT name FROM duijie_clients WHERE id = ?', [request.to_enterprise_id]);
    const [[proj2]] = await db.query('SELECT name FROM duijie_projects WHERE id = ?', [request.project_id]);
    await notify(request.requested_by, 'client_request_approved', '项目关联请求已通过', `企业「${toEnt?.name || ''}」已同意关联到项目「${proj2?.name || ''}」`, '/projects');

    broadcast('project', 'client_request_approved', { id: request.project_id, userId });
    logger.info(`client-request-approve: request=${requestId} project=${request.project_id} members=${memberIds.join(',')} by=${userId}`);
    res.json({ success: true, message: '已同意关联请求' });
  } catch (e) {
    logger.error(`client-request-approve: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
