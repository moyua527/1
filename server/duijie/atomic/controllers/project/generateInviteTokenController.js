const crypto = require('crypto');
const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const projectId = req.params.id;
    const token = crypto.randomBytes(16).toString('hex');

    await db.query(
      'INSERT INTO duijie_project_invite_tokens (project_id, token, created_by) VALUES (?, ?, ?)',
      [projectId, token, req.userId]
    );

    res.json({ success: true, data: { token } });
  } catch (e) {
    console.error('generateInviteToken error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
