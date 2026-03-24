const db = require('../../../config/db');
const { notify } = require('../../utils/notify');

module.exports = async (req, res) => {
  try {
    const { content } = req.body;
    const hasFiles = req.files && req.files.length > 0;
    if (!content && !hasFiles) return res.status(400).json({ success: false, message: '内容或附件不能为空' });
    const [[ticket]] = await db.query('SELECT id, title, created_by FROM duijie_tickets WHERE id = ? AND is_deleted = 0', [req.params.id]);
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
      [req.params.id, content || '', req.userId]
    );
    const replyId = r.insertId;
    if (hasFiles) {
      for (const f of req.files) {
        await db.query(
          'INSERT INTO duijie_ticket_attachments (ticket_id, reply_id, filename, original_name, file_size, mime_type, created_by) VALUES (?,?,?,?,?,?,?)',
          [req.params.id, replyId, f.filename, Buffer.from(f.originalname, 'latin1').toString('utf8'), f.size, f.mimetype, req.userId]
        );
      }
    }
    if (ticket.created_by && ticket.created_by !== req.userId) {
      await notify(ticket.created_by, 'ticket_reply', '工单回复', `你的工单「${ticket.title || '#' + ticket.id}」有新回复`, `/tickets`);
    }
    res.json({ success: true, data: { id: replyId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
