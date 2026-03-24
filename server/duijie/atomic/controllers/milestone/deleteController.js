const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM duijie_milestones WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
