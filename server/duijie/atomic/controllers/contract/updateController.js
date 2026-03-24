const updateContract = require('../../services/contract/updateContract');

module.exports = async (req, res) => {
  try {
    await updateContract(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
