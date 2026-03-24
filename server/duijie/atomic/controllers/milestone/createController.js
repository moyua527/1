const createMilestone = require('../../services/milestone/createMilestone');

module.exports = async (req, res) => {
  try {
    const id = await createMilestone({ ...req.body, created_by: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
