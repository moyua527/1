const listClients = require('../../services/client/listClients');

module.exports = async (req, res) => {
  try {
    const data = await listClients({ role: req.userRole, userId: req.userId });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
