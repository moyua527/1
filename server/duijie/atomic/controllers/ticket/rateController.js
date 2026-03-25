const { findTicket, rate } = require('../../services/ticket/rateTicket');

module.exports = async (req, res) => {
  try {
    const { rating, rating_comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: '评分1-5' });
    const ticket = await findTicket(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
    if (ticket.created_by !== req.userId) return res.status(403).json({ success: false, message: '只有提交者可以评价' });
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') return res.status(400).json({ success: false, message: '工单未解决，无法评价' });
    await rate(req.params.id, rating, rating_comment);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
