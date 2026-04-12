const db = require('../../../config/db');
const { broadcast } = require('../../../atomic/utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { project_id, task_id, work_date, hours, description } = req.body;
    if (!project_id || !work_date || !hours) {
      return res.status(400).json({ success: false, message: '项目、日期和工时为必填' });
    }
    if (hours <= 0 || hours > 24) {
      return res.status(400).json({ success: false, message: '工时必须在0.5-24小时之间' });
    }

    const [result] = await db.query(
      'INSERT INTO duijie_timesheets (user_id, task_id, project_id, work_date, hours, description) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, task_id || null, project_id, work_date, hours, description || null]
    );

    broadcast('timesheet', 'created', { id: result.insertId, project_id, userId: req.userId });
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '记录工时失败' });
  }
};
