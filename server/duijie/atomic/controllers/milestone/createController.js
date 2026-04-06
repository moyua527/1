const createMilestone = require('../../services/milestone/createMilestone');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const id = await createMilestone({ ...req.body, created_by: req.userId });
    broadcast('milestone', 'created', { project_id: req.body.project_id, userId: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
