const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { id, userId } = req.params;
    await db.query(
      'DELETE FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );
    broadcast('project', 'member_removed', { id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
