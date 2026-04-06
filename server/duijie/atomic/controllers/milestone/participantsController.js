const db = require('../../../config/db');

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mp.user_id, u.username, u.nickname
       FROM duijie_milestone_participants mp
       JOIN duijie_users u ON u.id = mp.user_id
       WHERE mp.milestone_id = ?
       ORDER BY mp.created_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: '缺少 user_id' });
    await db.query(
      'INSERT IGNORE INTO duijie_milestone_participants (milestone_id, user_id) VALUES (?, ?)',
      [req.params.id, user_id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM duijie_milestone_participants WHERE milestone_id = ? AND user_id = ?',
      [req.params.id, req.params.userId]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
