const deleteProject = require('../../services/project/deleteProject');

module.exports = async (req, res) => {
  try {
    await deleteProject(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
