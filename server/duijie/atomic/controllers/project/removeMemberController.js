const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { logActivity } = require('../../utils/activityLogger');

module.exports = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const [[removedUser]] = await db.query('SELECT nickname, username FROM voice_users WHERE id = ?', [userId]);
    await db.query(
      'DELETE FROM duijie_project_members WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );
    logActivity(id, req.userId, 'member_removed', { entityType: 'member', entityId: Number(userId), title: removedUser?.nickname || removedUser?.username || userId });
    broadcast('project', 'member_removed', { id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
