const updateTicket = require('../../services/ticket/updateTicket');
const { canAccessTicket } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    const allowed = await canAccessTicket(req.userId, req.userRole, req.params.id);
    if (!allowed) return res.status(403).json({ success: false, message: '无权操作此工单' });
    const { status, assigned_to, priority } = req.body;
    const result = await updateTicket(req.params.id, { status, assigned_to, priority });
    if (result.empty) return res.status(400).json({ success: false, message: '无更新内容' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
