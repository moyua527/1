const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id, userId } = req.params;
    await db.query(
      'DELETE FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
