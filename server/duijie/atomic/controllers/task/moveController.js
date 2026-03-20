const moveTask = require('../../services/task/moveTask');

module.exports = async (req, res) => {
  try {
    await moveTask(req.params.id, req.body.status, req.body.sort_order);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
