const listAuditLogs = require('../../services/audit/listAuditLogs');

module.exports = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const { action, entity_type, user_id, start_date, end_date, keyword } = req.query;
    const data = await listAuditLogs({ action, entity_type, user_id, start_date, end_date, keyword, page, limit });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
