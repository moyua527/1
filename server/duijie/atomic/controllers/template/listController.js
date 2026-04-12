const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const entId = req.activeEnterpriseId;
    const [rows] = await db.query(
      `SELECT t.*, u.nickname as creator_name
       FROM duijie_project_templates t
       LEFT JOIN voice_users u ON u.id = t.created_by
       WHERE t.is_deleted = 0 AND (t.enterprise_id IS NULL OR t.enterprise_id = ?)
       ORDER BY t.created_at DESC`,
      [entId || 0]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取模板失败' });
  }
};
