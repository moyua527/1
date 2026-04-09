const db = require('../../../config/db');
const logger = require('../../../config/logger');

module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 30 } = req.query;
    const cap = Math.min(parseInt(limit) || 30, 100);
    const offset = (Math.max(parseInt(page), 1) - 1) * cap;

    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM duijie_login_logs WHERE user_id = ?', [userId]);
    const [rows] = await db.query(
      'SELECT id, login_type, ip, device_name, status, fail_reason, created_at FROM duijie_login_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, cap, offset]
    );
    res.json({ success: true, data: { total, rows, page: parseInt(page), limit: cap } });
  } catch (e) {
    logger.error(`[loginLogs] ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
