const deleteOpportunity = require('../../services/opportunity/deleteOpportunity');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    await deleteOpportunity(req.params.id);
    broadcast('opportunity', 'deleted', { id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
