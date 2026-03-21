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
    if (req.userRole === 'client' && ticket.created_by !== req.userId) {
      return res.status(403).json({ success: false, message: '无权限' });
    }
    const [replies] = await db.query(
      `SELECT r.*, u.nickname as creator_name, u.username as creator_username, u.role as creator_role
       FROM duijie_ticket_replies r LEFT JOIN voice_users u ON r.created_by = u.id
       WHERE r.ticket_id = ? AND r.is_deleted = 0 ORDER BY r.created_at ASC`, [req.params.id]
    );
    res.json({ success: true, data: { ...ticket, replies } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
