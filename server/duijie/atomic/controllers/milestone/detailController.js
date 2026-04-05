const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const [[ms]] = await db.query(
      'SELECT m.*, COALESCE(u.nickname, u.username) AS creator_name FROM duijie_milestones m LEFT JOIN voice_users u ON u.id = m.created_by WHERE m.id = ? AND m.is_deleted = 0',
      [id]
    );
    if (!ms) return res.status(404).json({ success: false, message: '代办不存在' });

    const [progress] = await db.query(
      `SELECT p.*, COALESCE(u.nickname, u.username) AS author_name
       FROM duijie_milestone_progress p
       LEFT JOIN voice_users u ON u.id = p.created_by
       WHERE p.milestone_id = ? ORDER BY p.created_at ASC`,
      [id]
    );

    const [participants] = await db.query(
      `SELECT mp.*, COALESCE(u.nickname, u.username) AS display_name, u.avatar AS avatar_url
       FROM duijie_milestone_participants mp
       LEFT JOIN voice_users u ON u.id = mp.user_id
       WHERE mp.milestone_id = ?`,
      [id]
    );

    const [reminders] = await db.query(
      'SELECT * FROM duijie_milestone_reminders WHERE milestone_id = ? AND user_id = ? ORDER BY remind_at ASC',
      [id, req.userId]
    );

    res.json({
      success: true,
      data: {
        ...ms,
        progress,
        participants,
        reminders,
      },
    });
  } catch (e) {
    console.error('milestone detail error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
