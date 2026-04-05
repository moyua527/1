const db = require('../../../config/db');
const logger = require('../../../config/logger');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (id === 'all') {
      await db.query('DELETE FROM duijie_notifications WHERE user_id = ?', [userId]);
      return res.json({ success: true, message: '已清空所有通知' });
    }

    const [result] = await db.query(
      'DELETE FROM duijie_notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '通知不存在' });
    }

    res.json({ success: true });
  } catch (e) {
    logger.error(`deleteNotification: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
