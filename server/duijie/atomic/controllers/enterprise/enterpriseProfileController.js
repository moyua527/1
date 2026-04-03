const db = require('../../../config/db');
const { getUserActiveEnterpriseId } = require('../../services/accessScope');

/**
 * GET /api/enterprises/:id/profile
 * 查看合作企业的公开资料（组织成员、部门、共享项目）
 * 访问条件：请求者所在企业与目标企业有项目关联或审批通过的客户请求
 */
exports.getProfile = async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    if (!targetId) return res.status(400).json({ success: false, message: '参数错误' });

    // 验证目标企业存在
    const [[target]] = await db.query(
      "SELECT id, name, company, industry, scale, address, phone, email, website, company_type, established_date, business_scope, credit_code, legal_person, registered_capital, notes FROM duijie_clients WHERE id = ? AND client_type = 'company' AND is_deleted = 0",
      [targetId]
    );
    if (!target) return res.status(404).json({ success: false, message: '企业不存在' });

    // 权限检查：admin 直接通过
    if (req.userRole !== 'admin') {
      const activeEnterpriseId = await getUserActiveEnterpriseId(req.userId);
      if (!activeEnterpriseId) return res.status(403).json({ success: false, message: '请先加入企业' });

      // 自己的企业直接通过
      if (Number(activeEnterpriseId) !== targetId) {
        // 检查是否有合作关系（项目关联或审批通过的客户请求）
        const [[related]] = await db.query(
          `SELECT 1 FROM duijie_projects p
           WHERE p.is_deleted = 0
             AND (p.client_id = ? OR p.internal_client_id = ?)
             AND (p.internal_client_id = ? OR p.client_id = ?)
           UNION
           SELECT 1 FROM duijie_client_requests
           WHERE status = 'approved'
             AND ((from_enterprise_id = ? AND to_enterprise_id = ?) OR (from_enterprise_id = ? AND to_enterprise_id = ?))
           LIMIT 1`,
          [targetId, targetId, activeEnterpriseId, activeEnterpriseId,
           activeEnterpriseId, targetId, targetId, activeEnterpriseId]
        );
        if (!related) return res.status(403).json({ success: false, message: '无权查看该企业资料' });
      }
    }

    // 查询组织成员（不含敏感字段如 email）
    const [members] = await db.query(
      `SELECT m.id, m.name, m.position, m.department, m.department_id, m.role, m.phone, m.enterprise_role_id,
              er.name as enterprise_role_name, er.color as enterprise_role_color
       FROM duijie_client_members m
       LEFT JOIN enterprise_roles er ON er.id = m.enterprise_role_id AND er.is_deleted = 0
       WHERE m.client_id = ? AND m.is_deleted = 0
       ORDER BY CASE WHEN m.role = 'creator' THEN 0 ELSE 1 END, m.created_at ASC`,
      [targetId]
    );

    // 查询部门
    const [departments] = await db.query(
      'SELECT id, name, parent_id, sort_order FROM duijie_departments WHERE client_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, id ASC',
      [targetId]
    );

    // 查询共享项目（两个企业都参与的项目）
    let sharedProjects = [];
    const activeEnterpriseId = req.userRole === 'admin' ? null : await getUserActiveEnterpriseId(req.userId);
    if (activeEnterpriseId && Number(activeEnterpriseId) !== targetId) {
      const [projects] = await db.query(
        `SELECT p.id, p.name, p.status, p.description, p.start_date, p.end_date,
                u.nickname as creator_name,
                c.name as client_name, ic.name as internal_client_name
         FROM duijie_projects p
         LEFT JOIN voice_users u ON u.id = p.created_by
         LEFT JOIN duijie_clients c ON c.id = p.client_id
         LEFT JOIN duijie_clients ic ON ic.id = p.internal_client_id
         WHERE p.is_deleted = 0
           AND ((p.client_id = ? AND p.internal_client_id = ?) OR (p.client_id = ? AND p.internal_client_id = ?))
         ORDER BY p.created_at DESC`,
        [targetId, activeEnterpriseId, activeEnterpriseId, targetId]
      );
      sharedProjects = projects;
    }

    res.json({
      success: true,
      data: {
        enterprise: target,
        members,
        departments,
        sharedProjects,
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
