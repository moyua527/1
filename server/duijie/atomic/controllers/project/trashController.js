const db = require('../../../config/db');

// 列出当前用户所在企业的已删除项目
module.exports = async (req, res) => {
  try {
    const enterpriseId = req.headers['x-enterprise-id'];
    if (!enterpriseId) return res.status(400).json({ success: false, message: '缺少企业ID' });

    const [rows] = await db.query(
      `SELECT p.id, p.name, p.description, p.status, p.created_at, p.updated_at
       FROM duijie_projects p
       INNER JOIN duijie_project_members pm ON pm.project_id = p.id
       WHERE p.is_deleted = 1 AND pm.user_id = ? AND pm.enterprise_id = ?
       ORDER BY p.updated_at DESC`,
      [req.userId, enterpriseId]
    );

    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('项目回收站列表错误:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
