const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: [] });
    }

    const keyword = q.trim();

    // 搜索所有用户（排除已是项目成员的），通过 display_id、nickname、phone 匹配
    const [users] = await db.query(
      `SELECT u.id, u.nickname, u.display_id, u.avatar, u.phone
       FROM voice_users u
       WHERE u.is_deleted = 0
         AND u.id != ?
         AND u.id NOT IN (SELECT user_id FROM duijie_project_members WHERE project_id = ?)
         AND (u.display_id LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ?)
       ORDER BY u.id DESC
       LIMIT 20`,
      [req.userId, projectId, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    );

    res.json({ success: true, data: users });
  } catch (e) {
    console.error('searchUsersForInvite error:', e);
    res.status(500).json({ success: false, message: '搜索失败' });
  }
};
