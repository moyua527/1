const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const [rows] = await db.query(
      `SELECT id, name, field_type, options, required, sort_order
       FROM duijie_custom_fields
       WHERE project_id = ? AND is_deleted = 0
       ORDER BY sort_order ASC, id ASC`,
      [projectId]
    );
    const data = rows.map(r => ({
      ...r,
      options: typeof r.options === 'string' ? JSON.parse(r.options) : (r.options || []),
    }));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取字段失败' });
  }
};
