const deleteOpportunity = require('../../services/opportunity/deleteOpportunity');

module.exports = async (req, res) => {
  try {
    await deleteOpportunity(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
