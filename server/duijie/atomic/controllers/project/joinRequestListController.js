const db = require('../../../config/db');

// 列出项目的加入申请
module.exports = async (req, res) => {
  try {
    const projectId = req.params.id;

    const [rows] = await db.query(
      `SELECT jr.id, jr.project_id, jr.user_id, jr.message, jr.status, jr.created_at, jr.reviewed_at,
              jr.invited_by, jr.invite_type,
              u.nickname, u.username, u.phone,
              rv.nickname AS reviewer_name,
              inv.nickname AS inviter_name
       FROM duijie_project_join_requests jr
       LEFT JOIN voice_users u ON u.id = jr.user_id
       LEFT JOIN voice_users rv ON rv.id = jr.reviewed_by
       LEFT JOIN voice_users inv ON inv.id = jr.invited_by
       WHERE jr.project_id = ?
       ORDER BY FIELD(jr.status, 'pending', 'approved', 'rejected'), jr.created_at DESC`,
      [projectId]
    );

    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('joinRequestList error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
