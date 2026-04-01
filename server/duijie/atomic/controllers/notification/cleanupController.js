const db = require('../../../config/db');

/**
 * 清理已读通知（保留最近30天）
 * DELETE /api/notifications/cleanup
 */
module.exports = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM duijie_notifications WHERE user_id = ? AND is_read = 1 AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)',
      [req.userId]
    );
    res.json({ success: true, data: { deleted: result.affectedRows } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
