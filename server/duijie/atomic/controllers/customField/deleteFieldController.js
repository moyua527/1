const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE duijie_custom_fields SET is_deleted = 1 WHERE id = ?', [id]);
    await db.query('DELETE FROM duijie_custom_field_values WHERE field_id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '删除字段失败' });
  }
};
