const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    let where = 't.is_deleted = 0';
    const params = [];
    // Client only sees their own tickets
    if (req.userRole === 'client') {
      where += ' AND t.created_by = ?';
      params.push(req.userId);
    }
    const [rows] = await db.query(
      `SELECT t.*, u1.nickname as creator_name, u1.username as creator_username,
        u2.nickname as assignee_name, u2.username as assignee_username,
        p.name as project_name,
        (SELECT COUNT(*) FROM duijie_ticket_replies r WHERE r.ticket_id = t.id AND r.is_deleted = 0) as reply_count
       FROM duijie_tickets t
       LEFT JOIN voice_users u1 ON t.created_by = u1.id
       LEFT JOIN voice_users u2 ON t.assigned_to = u2.id
       LEFT JOIN duijie_projects p ON t.project_id = p.id
       WHERE ${where} ORDER BY t.created_at DESC`, params
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
