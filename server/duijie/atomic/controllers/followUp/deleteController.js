const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM duijie_follow_ups WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
