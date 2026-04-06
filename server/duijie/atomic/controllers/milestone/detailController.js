const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [[ms]] = await db.query(
      'SELECT * FROM duijie_milestones WHERE id = ? AND is_deleted = 0',
      [req.params.id]
    );
    if (!ms) return res.status(404).json({ success: false, message: '代办不存在' });

    const [[{ pCount }]] = await db.query(
      'SELECT COUNT(*) as pCount FROM duijie_milestone_participants WHERE milestone_id = ?',
      [req.params.id]
    );
    const [[{ mCount }]] = await db.query(
      'SELECT COUNT(*) as mCount FROM duijie_milestone_messages WHERE milestone_id = ?',
      [req.params.id]
    );
    const [[{ rCount }]] = await db.query(
      'SELECT COUNT(*) as rCount FROM duijie_milestone_reminders WHERE milestone_id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...ms, participant_count: pCount, message_count: mCount, reminder_count: rCount }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
