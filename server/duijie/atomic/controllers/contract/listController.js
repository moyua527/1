const listContracts = require('../../services/contract/listContracts');

module.exports = async (req, res) => {
  try {
    const data = await listContracts(req.params.clientId);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
