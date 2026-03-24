const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { status, assigned_to, priority } = req.body;
    const fields = [];
    const params = [];
    if (status) { fields.push('status = ?'); params.push(status); if (status === 'resolved') { fields.push('resolved_at = NOW()'); } }
    if (assigned_to !== undefined) { fields.push('assigned_to = ?'); params.push(assigned_to || null); }
    if (priority) { fields.push('priority = ?'); params.push(priority); }
    if (fields.length === 0) return res.status(400).json({ success: false, message: '无更新内容' });
    params.push(req.params.id);
    await db.query(`UPDATE duijie_tickets SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
