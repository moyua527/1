const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, field_type, options, required, sort_order } = req.body;

    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name = ?'); params.push(name); }
    if (field_type !== undefined) { sets.push('field_type = ?'); params.push(field_type); }
    if (options !== undefined) { sets.push('options = ?'); params.push(JSON.stringify(options)); }
    if (required !== undefined) { sets.push('required = ?'); params.push(required ? 1 : 0); }
    if (sort_order !== undefined) { sets.push('sort_order = ?'); params.push(sort_order); }

    if (sets.length === 0) return res.json({ success: true });

    params.push(id);
    await db.query(`UPDATE duijie_custom_fields SET ${sets.join(', ')} WHERE id = ? AND is_deleted = 0`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '更新字段失败' });
  }
};
