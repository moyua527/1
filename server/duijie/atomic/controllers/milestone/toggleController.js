const toggleMilestone = require('../../services/milestone/toggleMilestone');

module.exports = async (req, res) => {
  try {
    await toggleMilestone(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
