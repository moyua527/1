const listProjects = require('../../services/project/listProjects');

module.exports = async (req, res) => {
  try {
    const data = await listProjects(req.query, { role: req.userRole, userId: req.userId, clientId: req.clientId });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
