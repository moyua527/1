const db = require('../../../config/db');

/**
 * GET /api/auth/sessions
 * 获取当前用户的活跃会话列表
 */
module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const [sessions] = await db.query(
      `SELECT id, device_name, ip_address, user_agent, created_at, expires_at
       FROM refresh_tokens
       WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    // 解析浏览器信息
    const list = sessions.map(s => {
      let browser = '未知浏览器';
      const ua = s.user_agent || '';
      if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
      else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
      else if (/Firefox\//i.test(ua)) browser = 'Firefox';
      else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
      return {
        id: s.id,
        device_name: s.device_name || '未知设备',
        browser,
        ip_address: s.ip_address || '-',
        created_at: s.created_at,
        expires_at: s.expires_at,
      };
    });

    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
