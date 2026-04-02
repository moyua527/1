const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const role = req.userRole;
    const userId = req.userId;
    const entId = req.activeEnterpriseId;

    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 7), 365);
    const contractMonths = Math.min(Math.max(parseInt(req.query.contract_months) || 6, 1), 24);

    // 成员角色: 仅看参与项目关联的客户数据
    let clientFilter = '';
    let clientFilterParams = [];
    if (entId) {
      clientFilter = `AND c.id IN (
        SELECT DISTINCT CASE WHEN p.client_id = ? THEN p.internal_client_id ELSE p.client_id END
        FROM duijie_projects p
        WHERE p.is_deleted = 0 AND (p.internal_client_id = ? OR p.client_id = ?)
      ) AND c.id != ?`;
      clientFilterParams = [entId, entId, entId, entId];
    } else if (role === 'member') {
      clientFilter = `AND c.id IN (
        SELECT DISTINCT p.client_id FROM duijie_projects p
        WHERE p.is_deleted = 0 AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))
      )`;
      clientFilterParams = [userId, userId];
    }

    // 1. 漏斗转化: 各阶段客户数
    const [stageCounts] = await db.query(
      `SELECT stage, COUNT(*) as count FROM duijie_clients c WHERE c.is_deleted = 0 ${clientFilter} GROUP BY stage`,
      clientFilterParams
    );
    const funnel = { potential: 0, intent: 0, signed: 0, active: 0, lost: 0 };
    stageCounts.forEach(r => { if (funnel.hasOwnProperty(r.stage)) funnel[r.stage] = r.count; });

    // 2. 跟进趋势: 最近30天每天跟进数
    const [followTrend] = await db.query(
      `SELECT DATE(f.created_at) as date, COUNT(*) as count
       FROM duijie_follow_ups f
       ${role === 'member' ? 'INNER JOIN duijie_clients c ON f.client_id = c.id AND c.is_deleted = 0 ' + clientFilter : ''}
       WHERE f.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(f.created_at) ORDER BY date`,
      role === 'member' ? [...clientFilterParams, days] : [days]
    );

    // 3. 渠道分布
    const [channelDist] = await db.query(
      `SELECT COALESCE(NULLIF(c.channel,''), '未知') as channel, COUNT(*) as count
       FROM duijie_clients c WHERE c.is_deleted = 0 ${clientFilter} GROUP BY channel ORDER BY count DESC`,
      clientFilterParams
    );

    // 4. 合同趋势: 最近6个月每月合同金额
    const [contractTrend] = await db.query(
      `SELECT DATE_FORMAT(co.signed_date, '%Y-%m') as month, SUM(co.amount) as total, COUNT(*) as count
       FROM duijie_contracts co
       ${role === 'member' ? 'INNER JOIN duijie_clients c ON co.client_id = c.id AND c.is_deleted = 0 ' + clientFilter : ''}
       WHERE co.signed_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
       GROUP BY month ORDER BY month`,
      role === 'member' ? [...clientFilterParams, contractMonths] : [contractMonths]
    );

    // 5. 新增客户趋势
    const [clientTrend] = await db.query(
      `SELECT DATE(c.created_at) as date, COUNT(*) as count
       FROM duijie_clients c
       WHERE c.is_deleted = 0 AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${clientFilter}
       GROUP BY DATE(c.created_at) ORDER BY date`,
      [...clientFilterParams, days]
    );

    res.json({
      success: true,
      data: { funnel, followTrend, channelDist, contractTrend, clientTrend },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
