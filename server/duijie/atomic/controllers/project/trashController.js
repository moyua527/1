const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const enterpriseId = req.headers['x-enterprise-id'];

    let sql, params;
    if (enterpriseId) {
      sql = `SELECT p.id, p.name, p.description, p.status, p.created_at, p.updated_at
             FROM duijie_projects p
             INNER JOIN duijie_project_members pm ON pm.project_id = p.id
             WHERE p.is_deleted = 1 AND pm.user_id = ? AND pm.enterprise_id = ?
             ORDER BY p.updated_at DESC`;
      params = [req.userId, enterpriseId];
    } else {
      sql = `SELECT p.id, p.name, p.description, p.status, p.created_at, p.updated_at
             FROM duijie_projects p
             INNER JOIN duijie_project_members pm ON pm.project_id = p.id
             WHERE p.is_deleted = 1 AND pm.user_id = ?
             ORDER BY p.updated_at DESC`;
      params = [req.userId];
    }

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('项目回收站列表错误:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
