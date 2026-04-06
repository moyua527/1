const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const [[me]] = await db.query('SELECT active_enterprise_id FROM voice_users WHERE id = ?', [userId]);
    const entId = me?.active_enterprise_id || null;

    const [rows] = await db.query(
      `SELECT u.id, u.username, u.nickname, u.role,
              IF(u.active_enterprise_id IS NOT NULL AND u.active_enterprise_id = ?, 1, 0) AS is_colleague,
              MAX(IF(f.id IS NOT NULL, 1, 0)) AS is_friend,
              MAX(IF(cp.user_id IS NOT NULL, 1, 0)) AS is_collaborator
       FROM voice_users u
       LEFT JOIN duijie_friends f
         ON ((f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id))
         AND f.status = 'accepted'
       LEFT JOIN (
         SELECT DISTINCT pm2.user_id
         FROM duijie_project_members pm1
         JOIN duijie_project_members pm2 ON pm1.project_id = pm2.project_id AND pm2.user_id != ?
         WHERE pm1.user_id = ?
       ) cp ON cp.user_id = u.id
       WHERE u.is_deleted = 0 AND u.is_active = 1
         AND u.id != ?
         AND u.id NOT IN (SELECT user_id FROM duijie_project_members WHERE project_id = ?)
         AND (
           (u.active_enterprise_id IS NOT NULL AND u.active_enterprise_id = ?)
           OR f.id IS NOT NULL
           OR cp.user_id IS NOT NULL
         )
       GROUP BY u.id, u.username, u.nickname, u.role, u.active_enterprise_id
       ORDER BY is_colleague DESC, is_friend DESC, is_collaborator DESC, u.nickname, u.username`,
      [entId, userId, userId, userId, userId, userId, id, entId]
    );

    const data = rows.map(r => ({
      id: r.id, username: r.username, nickname: r.nickname, role: r.role,
      relation: r.is_colleague ? 'colleague' : r.is_friend ? 'friend' : 'collaborator'
    }));

    res.json({ success: true, data });
  } catch (e) {
    console.error('availableUsers error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
