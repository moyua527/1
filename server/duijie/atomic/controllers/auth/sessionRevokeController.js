const db = require('../../../config/db');

/**
 * DELETE /api/auth/sessions/:id
 * 撤销指定会话（远程注销设备）
 */
module.exports = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = parseInt(req.params.id, 10);
    if (!sessionId) return res.status(400).json({ success: false, message: '缺少会话ID' });

    // 只能撤销自己的会话
    const [result] = await db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ? AND user_id = ? AND revoked_at IS NULL',
      [sessionId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '会话不存在或已失效' });
    }

    res.json({ success: true, message: '设备已注销' });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
