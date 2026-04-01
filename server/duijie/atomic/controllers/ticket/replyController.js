const { findTicket, createReply } = require('../../services/ticket/replyTicket');
const { notify } = require('../../utils/notify');
const { canAccessTicket } = require('../../services/accessScope');

module.exports = async (req, res) => {
  try {
    const { content } = req.body;
    const hasFiles = req.files && req.files.length > 0;
    if (!content && !hasFiles) return res.status(400).json({ success: false, message: '内容或附件不能为空' });
    const allowed = await canAccessTicket(req.userId, req.userRole, req.params.id);
    if (!allowed) return res.status(403).json({ success: false, message: '无权操作此工单' });
    const ticket = await findTicket(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
    const replyId = await createReply(req.params.id, content, req.userId, req.files);
    if (ticket.created_by && ticket.created_by !== req.userId) {
      await notify(ticket.created_by, 'ticket_reply', '工单回复', `你的工单「${ticket.title || '#' + ticket.id}」有新回复`, `/tickets`);
    }
    res.json({ success: true, data: { id: replyId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
