const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { values } = req.body;
    if (!Array.isArray(values)) {
      return res.status(400).json({ success: false, message: '参数格式错误' });
    }

    for (const { field_id, value } of values) {
      if (!field_id) continue;
      if (value === null || value === undefined || value === '') {
        await db.query('DELETE FROM duijie_custom_field_values WHERE task_id = ? AND field_id = ?', [taskId, field_id]);
      } else {
        await db.query(
          `INSERT INTO duijie_custom_field_values (task_id, field_id, value) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE value = VALUES(value)`,
          [taskId, field_id, String(value)]
        );
      }
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '保存字段值失败' });
  }
};
