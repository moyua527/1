const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const deviceToken = String(req.body?.device_token || '').trim();
    if (!deviceToken) return res.status(400).json({ success: false, message: '缺少设备令牌' });

    await db.query(
      'UPDATE duijie_device_tokens SET is_active = 0, last_seen_at = NOW() WHERE user_id = ? AND device_token = ?',
      [userId, deviceToken]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '注销设备失败' });
  }
};
