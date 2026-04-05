const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const [[row]] = await db.query('SELECT * FROM duijie_milestone_reminders WHERE id = ?', [reminderId]);
    if (!row) return res.status(404).json({ success: false, message: '提醒不存在' });
    if (row.user_id !== req.userId) {
      return res.status(403).json({ success: false, message: '只能删除自己的提醒' });
    }
    await db.query('DELETE FROM duijie_milestone_reminders WHERE id = ?', [reminderId]);
    res.json({ success: true });
  } catch (e) {
    console.error('deleteReminder error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
