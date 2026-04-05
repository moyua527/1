const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { progressId } = req.params;
    const [[row]] = await db.query('SELECT * FROM duijie_milestone_progress WHERE id = ?', [progressId]);
    if (!row) return res.status(404).json({ success: false, message: '记录不存在' });
    if (row.created_by !== req.userId) {
      return res.status(403).json({ success: false, message: '只能删除自己的跟踪记录' });
    }
    await db.query('DELETE FROM duijie_milestone_progress WHERE id = ?', [progressId]);
    res.json({ success: true });
  } catch (e) {
    console.error('deleteProgress error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
