const listAllContacts = require('../../services/contact/listAllContacts');

module.exports = async (req, res) => {
  try {
    const data = await listAllContacts({ role: req.userRole, userId: req.userId, activeEnterpriseId: req.activeEnterpriseId });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
