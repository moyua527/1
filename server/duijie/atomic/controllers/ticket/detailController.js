const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [[ticket]] = await db.query(
      `SELECT t.*, u1.nickname as creator_name, u1.username as creator_username,
        u2.nickname as assignee_name, u2.username as assignee_username,
        p.name as project_name
       FROM duijie_tickets t
       LEFT JOIN voice_users u1 ON t.created_by = u1.id
       LEFT JOIN voice_users u2 ON t.assigned_to = u2.id
       LEFT JOIN duijie_projects p ON t.project_id = p.id
       WHERE t.id = ? AND t.is_deleted = 0`, [req.params.id]
    );
    if (!ticket) return res.status(404).json({ success: false, message: '工单不存在' });
    const [replies] = await db.query(
      `SELECT r.*, u.nickname as creator_name, u.username as creator_username, u.role as creator_role
       FROM duijie_ticket_replies r LEFT JOIN voice_users u ON r.created_by = u.id
       WHERE r.ticket_id = ? AND r.is_deleted = 0 ORDER BY r.created_at ASC`, [req.params.id]
    );
    const [attachments] = await db.query(
      'SELECT id, ticket_id, reply_id, filename, original_name, file_size, mime_type, created_by, created_at FROM duijie_ticket_attachments WHERE ticket_id = ?',
      [req.params.id]
    );
    const ticketAttachments = attachments.filter(a => !a.reply_id);
    for (const r of replies) {
      r.attachments = attachments.filter(a => a.reply_id === r.id);
    }
    res.json({ success: true, data: { ...ticket, replies, attachments: ticketAttachments } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
