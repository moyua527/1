const getClientDetail = require('../../services/client/getClientDetail');
const { getClientAccessStatus } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    const accessStatus = await getClientAccessStatus(req.userId, req.userRole, req.params.id);
    if (accessStatus === 'missing') return res.status(404).json({ success: false, message: '客户不存在' });
    if (accessStatus !== 'allowed') return res.status(403).json({ success: false, message: '无权访问此客户' });
    const data = await getClientDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: '客户不存在' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
