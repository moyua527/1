const updateProject = require('../../services/project/updateProject');
const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const pid = req.params.id;

    await updateProject(pid, req.body);
    broadcast('project', 'updated', { id: pid, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
