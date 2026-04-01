const getStats = require('../../services/dashboard/getStats');

module.exports = async (req, res) => {
  try {
    const data = await getStats({ role: req.userRole, userId: req.userId, clientId: req.clientId, activeEnterpriseId: req.activeEnterpriseId });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
