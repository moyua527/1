const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        project_id,
        COUNT(*) as total,
        SUM(CASE 
          WHEN type IN ('task_assigned','task_status','task_created') THEN 1
          WHEN type = 'task_comment' AND link NOT LIKE '%tab=todo%' AND link NOT LIKE '%tab=milestones%' THEN 1
          ELSE 0 
        END) as tasks,
        SUM(CASE 
          WHEN link LIKE '%tab=todo%' OR link LIKE '%tab=milestones%' THEN 1
          WHEN type = 'follow_reminder' THEN 1
          ELSE 0 
        END) as todo,
        SUM(CASE 
          WHEN type LIKE '%message%' OR link LIKE '%tab=messages%' THEN 1
          ELSE 0 
        END) as messages,
        SUM(CASE WHEN link LIKE '%tab=files%' THEN 1 ELSE 0 END) as files
      FROM duijie_notifications
      WHERE user_id = ? AND is_read = 0 AND project_id IS NOT NULL
      GROUP BY project_id
    `, [req.userId]);

    const byProject = {};
    for (const r of rows) {
      byProject[r.project_id] = {
        total: Number(r.total),
        tasks: Number(r.tasks),
        todo: Number(r.todo),
        messages: Number(r.messages),
        files: Number(r.files),
      };
    }
    res.json({ success: true, data: byProject });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
