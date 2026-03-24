const listMilestones = require('../../services/milestone/listMilestones');

module.exports = async (req, res) => {
  try {
    const data = await listMilestones(req.query.project_id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
