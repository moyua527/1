const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.name, p.description, p.status, p.created_at, p.updated_at
       FROM duijie_projects p
       INNER JOIN duijie_project_members pm ON pm.project_id = p.id
       WHERE p.is_deleted = 1 AND pm.user_id = ?
       ORDER BY p.updated_at DESC`,
      [req.userId]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('项目回收站列表错误:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
