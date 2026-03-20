const updateProject = require('../../services/project/updateProject');

module.exports = async (req, res) => {
  try {
    await updateProject(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
