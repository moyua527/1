const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { remind_at, note } = req.body;
    if (!remind_at) return res.status(400).json({ success: false, message: '请设置提醒时间' });

    const [[ms]] = await db.query(
      'SELECT id, created_by FROM duijie_milestones WHERE id = ? AND is_deleted = 0', [id]
    );
    if (!ms) return res.status(404).json({ success: false, message: '代办不存在' });

    const [[participant]] = await db.query(
      'SELECT id FROM duijie_milestone_participants WHERE milestone_id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (ms.created_by !== req.userId && !participant) {
      return res.status(403).json({ success: false, message: '只有发起人和参与人可以设置提醒' });
    }

    const [result] = await db.query(
      'INSERT INTO duijie_milestone_reminders (milestone_id, user_id, remind_at, note) VALUES (?, ?, ?, ?)',
      [id, req.userId, remind_at, note || '']
    );

    res.json({ success: true, data: { id: result.insertId, milestone_id: Number(id), user_id: req.userId, remind_at, note: note || '', is_sent: 0 } });
  } catch (e) {
    console.error('addReminder error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
