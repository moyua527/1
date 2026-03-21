const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: '内容必填' });
    const [[ticket]] = await db.query('SELECT id, created_by FROM duijie_tickets WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
    if (req.userRole === 'client' && ticket.created_by !== req.userId) {
      return res.status(403).json({ success: false, message: '无权限' });
    }
    // Auto set to processing if staff replies to an open ticket
    if (req.userRole !== 'client') {
      await db.query("UPDATE duijie_tickets SET status = 'processing' WHERE id = ? AND status = 'open'", [req.params.id]);
    }
    const [r] = await db.query(
      'INSERT INTO duijie_ticket_replies (ticket_id, content, created_by) VALUES (?,?,?)',
      [req.params.id, content, req.userId]
    );
    res.json({ success: true, data: { id: r.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
