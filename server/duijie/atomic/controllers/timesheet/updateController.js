const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const id = req.params.id;
    const { task_id, work_date, hours, description } = req.body;

    const [[row]] = await db.query('SELECT * FROM duijie_timesheets WHERE id = ? AND is_deleted = 0', [id]);
    if (!row) return res.status(404).json({ success: false, message: '记录不存在' });
    if (row.user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: '只能修改自己的工时' });
    }

    const sets = [];
    const params = [];
    if (task_id !== undefined) { sets.push('task_id = ?'); params.push(task_id || null); }
    if (work_date) { sets.push('work_date = ?'); params.push(work_date); }
    if (hours) { sets.push('hours = ?'); params.push(hours); }
    if (description !== undefined) { sets.push('description = ?'); params.push(description); }

    if (sets.length === 0) return res.json({ success: true });

    params.push(id);
    await db.query(`UPDATE duijie_timesheets SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '更新失败' });
  }
};
