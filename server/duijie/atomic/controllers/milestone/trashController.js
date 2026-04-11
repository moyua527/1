const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ success: false, message: '缺少 project_id' });
    const [rows] = await db.query(
      'SELECT * FROM duijie_milestones WHERE project_id = ? AND is_deleted = 1 ORDER BY updated_at DESC',
      [project_id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
