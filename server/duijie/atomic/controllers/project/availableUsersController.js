const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nickname, u.role FROM voice_users u
       WHERE u.is_deleted = 0 AND u.is_active = 1
       AND u.id NOT IN (SELECT user_id FROM duijie_project_members WHERE project_id = ?)
       ORDER BY u.nickname, u.username`,
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
