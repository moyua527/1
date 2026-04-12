const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { project_id, user_id, start_date, end_date } = req.query;
    const role = req.userRole;
    const uid = req.userId;

    let where = 'ts.is_deleted = 0';
    const params = [];

    if (project_id) { where += ' AND ts.project_id = ?'; params.push(project_id); }
    if (user_id) { where += ' AND ts.user_id = ?'; params.push(user_id); }
    if (start_date) { where += ' AND ts.work_date >= ?'; params.push(start_date); }
    if (end_date) { where += ' AND ts.work_date <= ?'; params.push(end_date); }

    if (role !== 'admin') {
      where += ' AND (ts.user_id = ? OR ts.project_id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';
      params.push(uid, uid);
    }

    const [rows] = await db.query(
      `SELECT ts.*, u.nickname as user_name, p.name as project_name, t.title as task_title
       FROM duijie_timesheets ts
       LEFT JOIN voice_users u ON u.id = ts.user_id
       LEFT JOIN duijie_projects p ON p.id = ts.project_id
       LEFT JOIN duijie_tasks t ON t.id = ts.task_id
       WHERE ${where}
       ORDER BY ts.work_date DESC, ts.created_at DESC
       LIMIT 500`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取工时失败' });
  }
};
