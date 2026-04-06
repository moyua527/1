const db = require('../../../config/db');
const toggleMilestone = require('../../services/milestone/toggleMilestone');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    await toggleMilestone(req.params.id);
    const [[ms]] = await db.query('SELECT project_id FROM duijie_milestones WHERE id = ?', [req.params.id]);
    if (ms) broadcast('milestone', 'toggled', { project_id: ms.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
