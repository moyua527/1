const listFollowUps = require('../../services/followUp/listFollowUps');

module.exports = async (req, res) => {
  try {
    const data = await listFollowUps(req.params.clientId);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
