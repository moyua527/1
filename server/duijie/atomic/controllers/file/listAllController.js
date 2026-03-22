const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const role = req.userRole;
    const uid = req.userId;
    let where = 'f.is_deleted = 0';
    const params = [];

    if (role === 'member') {
      where += ' AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';
      params.push(uid, uid);
    } else if (role === 'business') {
      where += ' AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?) OR p.client_id IN (SELECT id FROM duijie_clients WHERE (assigned_to = ? OR created_by = ?) AND is_deleted = 0))';
      params.push(uid, uid, uid, uid);
    }

    const [rows] = await db.query(
      `SELECT f.*, p.name as project_name, u.nickname as uploader_name
       FROM duijie_files f
       LEFT JOIN duijie_projects p ON f.project_id = p.id
       LEFT JOIN voice_users u ON f.created_by = u.id
       WHERE ${where}
       ORDER BY f.created_at DESC LIMIT 200`, params
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
