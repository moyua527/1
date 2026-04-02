const createContact = require('../../services/contact/createContact');
const { getClientAccessStatus } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    const accessStatus = await getClientAccessStatus(req.userId, req.userRole, req.body.client_id);
    if (accessStatus === 'missing') return res.status(404).json({ success: false, message: '客户不存在' });
    if (accessStatus !== 'allowed') return res.status(403).json({ success: false, message: '无权访问此客户' });
    const id = await createContact({ ...req.body, created_by: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
