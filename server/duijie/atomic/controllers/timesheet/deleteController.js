const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const id = req.params.id;
    const [[row]] = await db.query('SELECT * FROM duijie_timesheets WHERE id = ? AND is_deleted = 0', [id]);
    if (!row) return res.status(404).json({ success: false, message: '记录不存在' });
    if (row.user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: '只能删除自己的工时' });
    }

    await db.query('UPDATE duijie_timesheets SET is_deleted = 1 WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '删除失败' });
  }
};
