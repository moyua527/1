const db = require('../../../config/db');

/**
 * DELETE /api/auth/sessions
 * 注销所有其他设备（保留当前会话）
 */
module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    // 获取当前请求的 refresh token hash 以排除
    const crypto = require('crypto');
    const rawToken = req.cookies?.refresh_token;
    let currentHash = null;
    if (rawToken) {
      currentHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    }

    let sql, params;
    if (currentHash) {
      sql = 'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL AND token_hash != ?';
      params = [userId, currentHash];
    } else {
      sql = 'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL';
      params = [userId];
    }

    const [result] = await db.query(sql, params);
    res.json({ success: true, message: `已注销 ${result.affectedRows} 个其他设备` });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
