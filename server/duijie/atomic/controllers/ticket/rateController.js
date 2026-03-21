const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { rating, rating_comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: '评分1-5' });
    const [[ticket]] = await db.query('SELECT id, created_by, status FROM duijie_tickets WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
    if (ticket.created_by !== req.userId) return res.status(403).json({ success: false, message: '只有提交者可以评价' });
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') return res.status(400).json({ success: false, message: '工单未解决，无法评价' });
    await db.query(
      "UPDATE duijie_tickets SET rating = ?, rating_comment = ?, status = 'closed' WHERE id = ?",
      [rating, rating_comment || '', req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
