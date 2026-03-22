const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const role = req.userRole;
    const uid = req.userId;

    // Task trend: tasks created per day
    const [taskTrend] = await db.query(
      `SELECT DATE(t.created_at) as date, COUNT(*) as created,
        SUM(CASE WHEN t.status IN ('accepted','done') THEN 1 ELSE 0 END) as completed
       FROM duijie_tasks t
       WHERE t.is_deleted = 0 AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(t.created_at) ORDER BY date`, [days]
    );

    // Client trend (admin/business only)
    let clientTrend = [];
    if (['admin', 'business'].includes(role)) {
      let cf = '', cfp = [];
      if (role === 'business') { cf = 'AND (assigned_to = ? OR created_by = ?)'; cfp = [uid, uid]; }
      const [rows] = await db.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count FROM duijie_clients
         WHERE is_deleted = 0 AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) ${cf}
         GROUP BY DATE(created_at) ORDER BY date`, [days, ...cfp]
      );
      clientTrend = rows;
    }

    // Task status distribution
    const [taskDist] = await db.query(
      `SELECT status, COUNT(*) as count FROM duijie_tasks WHERE is_deleted = 0 GROUP BY status`
    );

    // Opportunity stage distribution (admin/business)
    let oppDist = [];
    if (['admin', 'business'].includes(role)) {
      let of = '', ofp = [];
      if (role === 'business') { of = 'AND (assigned_to = ? OR created_by = ?)'; ofp = [uid, uid]; }
      const [rows] = await db.query(
        `SELECT stage, COUNT(*) as count, COALESCE(SUM(amount),0) as amount FROM duijie_opportunities
         WHERE is_deleted = 0 ${of} GROUP BY stage`, ofp
      );
      oppDist = rows;
    }

    res.json({ success: true, data: { taskTrend, clientTrend, taskDist, oppDist } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
