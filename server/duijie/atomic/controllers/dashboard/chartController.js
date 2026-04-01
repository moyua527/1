const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const role = req.userRole;
    const uid = req.userId;
    const entId = req.activeEnterpriseId;

    // Enterprise project filter
    const entPF = entId ? 'AND t.project_id IN (SELECT id FROM duijie_projects WHERE is_deleted = 0 AND (internal_client_id = ? OR client_id = ?))' : '';
    const entPP = entId ? [entId, entId] : [];

    // Task filter for non-admin
    let tf = '', tp = [];
    if (role !== 'admin' && uid) {
      tf = `AND (t.assignee_id = ? OR t.project_id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?) OR t.project_id IN (SELECT id FROM duijie_projects WHERE created_by = ? AND is_deleted = 0)) ${entPF}`;
      tp = [uid, uid, uid, ...entPP];
    } else if (entId) {
      tf = entPF;
      tp = [...entPP];
    }

    // Task trend: tasks created per day
    const [taskTrend] = await db.query(
      `SELECT DATE(t.created_at) as date, COUNT(*) as created,
        SUM(CASE WHEN t.status IN ('accepted','done') THEN 1 ELSE 0 END) as completed
       FROM duijie_tasks t
       WHERE t.is_deleted = 0 AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${tf}
       GROUP BY DATE(t.created_at) ORDER BY date`, [days, ...tp]
    );

    // Client trend
    let clientTrend = [];
    {
      let cf = '', cfp = [];
      if (entId) {
        cf = 'AND id IN (SELECT DISTINCT CASE WHEN p.client_id = ? THEN p.internal_client_id ELSE p.client_id END FROM duijie_projects p WHERE p.is_deleted = 0 AND (p.internal_client_id = ? OR p.client_id = ?)) AND id != ?';
        cfp = [entId, entId, entId, entId];
      } else if (role !== 'admin' && uid) {
        cf = 'AND id IN (SELECT DISTINCT p.client_id FROM duijie_projects p WHERE p.is_deleted = 0 AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?)))';
        cfp = [uid, uid];
      }
      const [rows] = await db.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count FROM duijie_clients
         WHERE is_deleted = 0 AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${cf}
         GROUP BY DATE(created_at) ORDER BY date`, [days, ...cfp]
      );
      clientTrend = rows;
    }

    // Task status distribution
    const [taskDist] = await db.query(
      `SELECT t.status, COUNT(*) as count FROM duijie_tasks t WHERE t.is_deleted = 0 ${tf} GROUP BY t.status`, tp
    );

    // Opportunity stage distribution
    let oppDist = [];
    {
      let of = '', ofp = [];
      if (entId) {
        of = 'AND client_id IN (SELECT DISTINCT CASE WHEN p.client_id = ? THEN p.internal_client_id ELSE p.client_id END FROM duijie_projects p WHERE p.is_deleted = 0 AND (p.internal_client_id = ? OR p.client_id = ?))';
        ofp = [entId, entId, entId];
      } else if (role !== 'admin' && uid) {
        of = 'AND (assigned_to = ? OR created_by = ?)';
        ofp = [uid, uid];
      }
      const [rows] = await db.query(
        `SELECT stage, COUNT(*) as count, COALESCE(SUM(amount),0) as amount FROM duijie_opportunities
         WHERE is_deleted = 0 ${of} GROUP BY stage`, ofp
      );
      oppDist = rows;
    }

    res.json({ success: true, data: { taskTrend, clientTrend, taskDist, oppDist } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
