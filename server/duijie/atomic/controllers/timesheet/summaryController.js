const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.query;
    const role = req.userRole;
    const uid = req.userId;

    let where = 'ts.is_deleted = 0';
    const params = [];

    if (project_id) { where += ' AND ts.project_id = ?'; params.push(project_id); }
    if (start_date) { where += ' AND ts.work_date >= ?'; params.push(start_date); }
    if (end_date) { where += ' AND ts.work_date <= ?'; params.push(end_date); }

    if (role !== 'admin') {
      where += ' AND (ts.user_id = ? OR ts.project_id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';
      params.push(uid, uid);
    }

    const [byUser] = await db.query(
      `SELECT ts.user_id, u.nickname as user_name, SUM(ts.hours) as total_hours, COUNT(*) as record_count
       FROM duijie_timesheets ts
       LEFT JOIN voice_users u ON u.id = ts.user_id
       WHERE ${where}
       GROUP BY ts.user_id
       ORDER BY total_hours DESC`,
      params
    );

    const [byProject] = await db.query(
      `SELECT ts.project_id, p.name as project_name, SUM(ts.hours) as total_hours, COUNT(*) as record_count
       FROM duijie_timesheets ts
       LEFT JOIN duijie_projects p ON p.id = ts.project_id
       WHERE ${where}
       GROUP BY ts.project_id
       ORDER BY total_hours DESC`,
      params
    );

    const [[{ grand_total }]] = await db.query(
      `SELECT COALESCE(SUM(hours), 0) as grand_total FROM duijie_timesheets ts WHERE ${where}`,
      params
    );

    res.json({ success: true, data: { byUser, byProject, grandTotal: Number(grand_total) } });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
};
