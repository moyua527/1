const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    await db.query('UPDATE duijie_opportunities SET is_deleted = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
