const db = require('../../../config/db');
const { notify } = require('../../utils/notify');

exports.list = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mm.*, u.username, u.nickname
       FROM duijie_milestone_messages mm
       JOIN duijie_users u ON u.id = mm.user_id
       WHERE mm.milestone_id = ?
       ORDER BY mm.created_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { content, mentioned_users } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: '内容不能为空' });

    const mentions = Array.isArray(mentioned_users) ? mentioned_users : [];
    const [result] = await db.query(
      'INSERT INTO duijie_milestone_messages (milestone_id, user_id, content, mentioned_users) VALUES (?, ?, ?, ?)',
      [req.params.id, req.userId, content.trim(), JSON.stringify(mentions)]
    );

    const [[ms]] = await db.query('SELECT title, project_id FROM duijie_milestones WHERE id = ?', [req.params.id]);
    if (ms && mentions.length > 0) {
      for (const uid of mentions) {
        if (uid !== req.userId) {
          notify(uid, 'task_comment', `代办「${ms.title}」有人@了你`, content.trim().substring(0, 100), `/projects/${ms.project_id}?tab=todo`, ms.project_id);
        }
      }
    }

    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
