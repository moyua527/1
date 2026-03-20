const listTasks = require('../../services/task/listTasks');

module.exports = async (req, res) => {
  try {
    const data = await listTasks(req.query.project_id, { role: req.userRole, userId: req.userId });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
