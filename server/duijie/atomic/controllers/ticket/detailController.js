const getTicketDetail = require('../../services/ticket/getTicketDetail');
const { canAccessTicket } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    const allowed = await canAccessTicket(req.userId, req.userRole, req.params.id);
    if (!allowed) return res.status(403).json({ success: false, message: '无权访问此工单' });
    const data = await getTicketDetail(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: '工单不存在' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
