const db = require('../../../config/db');
const { notify } = require('../../utils/notify');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_ids } = req.body;
    if (!Array.isArray(user_ids)) return res.status(400).json({ success: false, message: '参数错误' });

    const [[ms]] = await db.query(
      'SELECT id, title, project_id, created_by FROM duijie_milestones WHERE id = ? AND is_deleted = 0',
      [id]
    );
    if (!ms) return res.status(404).json({ success: false, message: '代办不存在' });
    if (ms.created_by !== req.userId) {
      return res.status(403).json({ success: false, message: '只有发起人可以设定参与人' });
    }

    const [existing] = await db.query('SELECT user_id FROM duijie_milestone_participants WHERE milestone_id = ?', [id]);
    const existingIds = new Set(existing.map(r => r.user_id));

    const toAdd = user_ids.filter(uid => !existingIds.has(uid));
    const toRemove = [...existingIds].filter(uid => !user_ids.includes(uid));

    if (toRemove.length) {
      await db.query('DELETE FROM duijie_milestone_participants WHERE milestone_id = ? AND user_id IN (?)', [id, toRemove]);
    }
    for (const uid of toAdd) {
      await db.query('INSERT IGNORE INTO duijie_milestone_participants (milestone_id, user_id) VALUES (?, ?)', [id, uid]);
      await notify(uid, 'task_assigned', '代办参与邀请', `您被邀请参与代办「${ms.title}」`, `/projects/${ms.project_id}?tab=milestones`);
    }

    const [participants] = await db.query(
      `SELECT mp.*, COALESCE(u.nickname, u.username) AS display_name, u.avatar AS avatar_url
       FROM duijie_milestone_participants mp
       LEFT JOIN voice_users u ON u.id = mp.user_id
       WHERE mp.milestone_id = ?`,
      [id]
    );

    res.json({ success: true, data: participants });
  } catch (e) {
    console.error('setParticipants error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
