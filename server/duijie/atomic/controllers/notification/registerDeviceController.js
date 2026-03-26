const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const deviceToken = String(req.body?.device_token || '').trim();
    const platform = String(req.body?.platform || '').trim();
    const appVersion = String(req.body?.app_version || '').trim() || null;

    if (!deviceToken) return res.status(400).json({ success: false, message: '缺少设备令牌' });
    if (!['android', 'ios', 'web'].includes(platform)) return res.status(400).json({ success: false, message: '无效的平台类型' });

    await db.query(
      `INSERT INTO duijie_device_tokens (user_id, platform, device_token, app_version, is_active, last_seen_at)
       VALUES (?, ?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         platform = VALUES(platform),
         app_version = VALUES(app_version),
         is_active = 1,
         last_seen_at = NOW()`,
      [userId, platform, deviceToken, appVersion]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '注册设备失败' });
  }
};
