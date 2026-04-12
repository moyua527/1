const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const [rows] = await db.query(
      `SELECT v.field_id, v.value, f.name, f.field_type, f.options
       FROM duijie_custom_field_values v
       JOIN duijie_custom_fields f ON f.id = v.field_id AND f.is_deleted = 0
       WHERE v.task_id = ?`,
      [taskId]
    );
    const data = rows.map(r => ({
      field_id: r.field_id,
      name: r.name,
      field_type: r.field_type,
      options: typeof r.options === 'string' ? JSON.parse(r.options) : (r.options || []),
      value: r.value,
    }));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '获取字段值失败' });
  }
};
