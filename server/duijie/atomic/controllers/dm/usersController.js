const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    let rows;
    if (req.userRole === 'client' && req.clientId) {
      // Client can only message project members + project creators
      [rows] = await db.query(
        `SELECT DISTINCT u.id, u.username, u.nickname, u.role FROM voice_users u
         WHERE u.id != ? AND u.is_deleted = 0 AND (
           u.id IN (SELECT pm.user_id FROM duijie_project_members pm INNER JOIN duijie_projects p ON pm.project_id = p.id WHERE p.client_id = ? AND p.is_deleted = 0)
           OR u.id IN (SELECT p.created_by FROM duijie_projects p WHERE p.client_id = ? AND p.is_deleted = 0)
         ) ORDER BY u.created_at DESC`,
        [req.userId, req.clientId, req.clientId]
      );
    } else {
      [rows] = await db.query(
        'SELECT id, username, nickname, role FROM voice_users WHERE id != ? AND is_deleted = 0 ORDER BY created_at DESC',
        [req.userId]
      );
    }
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
