const moveTask = require('../../services/task/moveTask');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    await moveTask(req.params.id, req.body.status, req.body.sort_order);
    broadcast('task', 'updated', { id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
