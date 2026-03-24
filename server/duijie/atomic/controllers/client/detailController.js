const getClientDetail = require('../../services/client/getClientDetail');

module.exports = async (req, res) => {
  try {
    const data = await getClientDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: '客户不存在' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
