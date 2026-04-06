const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const [[ms]] = await db.query('SELECT project_id FROM duijie_milestones WHERE id = ?', [id]);
    await db.query('DELETE FROM duijie_milestones WHERE id = ?', [id]);
    if (ms) broadcast('milestone', 'deleted', { project_id: ms.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
