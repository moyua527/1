const updateTask = require('../../services/task/updateTask');

module.exports = async (req, res) => {
  try {
    await updateTask(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
