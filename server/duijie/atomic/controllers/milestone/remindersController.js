const db = require('../../../config/db');

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.username, u.nickname
       FROM duijie_milestone_reminders r
       JOIN voice_users u ON u.id = r.user_id
       WHERE r.milestone_id = ?
       ORDER BY r.remind_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { remind_at, message } = req.body;
    if (!remind_at) return res.status(400).json({ success: false, message: '请选择提醒时间' });

    const [result] = await db.query(
      'INSERT INTO duijie_milestone_reminders (milestone_id, user_id, remind_at, message) VALUES (?, ?, ?, ?)',
      [req.params.id, req.userId, remind_at, message || null]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query('DELETE FROM duijie_milestone_reminders WHERE id = ?', [req.params.reminderId]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
