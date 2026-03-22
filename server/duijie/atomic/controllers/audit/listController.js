const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const { action, entity_type, user_id } = req.query;

    let where = '1=1';
    const params = [];
    if (action) { where += ' AND action = ?'; params.push(action); }
    if (entity_type) { where += ' AND entity_type = ?'; params.push(entity_type); }
    if (user_id) { where += ' AND user_id = ?'; params.push(user_id); }

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM duijie_audit_logs WHERE ${where}`, params);
    const [rows] = await db.query(
      `SELECT a.*, u.nickname FROM duijie_audit_logs a LEFT JOIN voice_users u ON a.user_id = u.id WHERE ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ success: true, data: { logs: rows, total, page, limit } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
