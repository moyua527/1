const db = require('../../../config/db');

const TAB_CONDITIONS = {
  tasks: `(type IN ('task_assigned','task_status','task_created') OR (type = 'task_comment' AND link NOT LIKE '%tab=todo%' AND link NOT LIKE '%tab=milestones%'))`,
  todo: `(link LIKE '%tab=todo%' OR link LIKE '%tab=milestones%' OR type = 'follow_reminder')`,
  messages: `(type LIKE '%message%' OR link LIKE '%tab=messages%')`,
  files: `(link LIKE '%tab=files%')`,
};

module.exports = async (req, res) => {
  try {
    const { project_id, tab } = req.body;
    if (!project_id || !tab) return res.status(400).json({ success: false, message: 'project_id and tab required' });
    const cond = TAB_CONDITIONS[tab];
    if (!cond) return res.status(400).json({ success: false, message: 'invalid tab' });

    await db.query(
      `UPDATE duijie_notifications SET is_read = 1 WHERE user_id = ? AND project_id = ? AND is_read = 0 AND ${cond}`,
      [req.userId, project_id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
