const createProject = require('../../services/project/createProject');

module.exports = async (req, res) => {
  try {
    const id = await createProject({ ...req.body, created_by: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
