const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const projectId = req.query.project_id;
    if (!projectId) return res.status(400).json({ success: false, message: '缺少 project_id' });

    const [rows] = await db.query(
      `SELECT t.*, u.nickname as assignee_name, cr.nickname as creator_name
       FROM duijie_tasks t
       LEFT JOIN voice_users u ON u.id = t.assignee_id
       LEFT JOIN voice_users cr ON cr.id = t.created_by
       WHERE t.project_id = ? AND t.is_deleted = 1
       ORDER BY t.updated_at DESC`,
      [projectId]
    );

    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
