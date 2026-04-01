const { getUserActiveEnterpriseId, listEnterpriseUsers } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    const enterpriseId = await getUserActiveEnterpriseId(req.userId);
    if (!enterpriseId) {
      return res.json({ success: true, data: [] });
    }
    const rows = await listEnterpriseUsers(enterpriseId);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
