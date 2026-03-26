const deleteProject = require('../../services/project/deleteProject');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    await deleteProject(req.params.id);
    broadcast('project', 'deleted', { id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
