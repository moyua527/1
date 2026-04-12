const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const { name, field_type, options, required } = req.body;
    if (!name || !field_type) {
      return res.status(400).json({ success: false, message: '字段名称和类型必填' });
    }
    const validTypes = ['text', 'number', 'date', 'amount', 'select', 'multi_select'];
    if (!validTypes.includes(field_type)) {
      return res.status(400).json({ success: false, message: '无效的字段类型' });
    }

    const [[{ maxSort }]] = await db.query(
      'SELECT COALESCE(MAX(sort_order), 0) as maxSort FROM duijie_custom_fields WHERE project_id = ? AND is_deleted = 0',
      [projectId]
    );

    const [result] = await db.query(
      'INSERT INTO duijie_custom_fields (project_id, name, field_type, options, required, sort_order, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projectId, name, field_type, JSON.stringify(options || []), required ? 1 : 0, maxSort + 1, req.userId]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: '创建字段失败' });
  }
};
