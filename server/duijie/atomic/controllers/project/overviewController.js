const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    const [[taskStats]] = await db.query(
      `SELECT
        COUNT(*) AS total,
        SUM(status IN ('accepted','done')) AS completed,
        SUM(status = 'todo') AS todo,
        SUM(status = 'submitted') AS submitted,
        SUM(status = 'in_progress') AS in_progress,
        SUM(status = 'pending_review') AS pending_review,
        SUM(status = 'review_failed') AS review_failed,
        SUM(status = 'disputed') AS disputed,
        SUM(due_date IS NOT NULL AND due_date < CURDATE() AND status NOT IN ('accepted','done')) AS overdue
      FROM duijie_tasks
      WHERE project_id = ? AND is_deleted = 0`,
      [id]
    );

    const [[{ member_count }]] = await db.query(
      'SELECT COUNT(*) AS member_count FROM duijie_project_members WHERE project_id = ?',
      [id]
    );

    const [[{ file_count }]] = await db.query(
      'SELECT COUNT(*) AS file_count FROM duijie_files WHERE project_id = ? AND is_deleted = 0',
      [id]
    );

    const [[{ message_count }]] = await db.query(
      'SELECT COUNT(*) AS message_count FROM duijie_messages WHERE project_id = ? AND is_deleted = 0',
      [id]
    );

    const [[{ milestone_total, milestone_done }]] = await db.query(
      `SELECT COUNT(*) AS milestone_total,
              SUM(is_completed = 1) AS milestone_done
       FROM duijie_milestones
       WHERE project_id = ? AND is_deleted = 0`,
      [id]
    );

    let activity = [];
    try {
      const [actRows] = await db.query(
        `SELECT a.type, a.title, a.created_at AS happened_at, u.nickname AS actor_name, u.avatar AS actor_avatar
         FROM duijie_project_activities a LEFT JOIN voice_users u ON u.id = a.user_id
         WHERE a.project_id = ? ORDER BY a.created_at DESC LIMIT 10`,
        [id]
      );
      activity = actRows;
    } catch {}
    if (activity.length === 0) {
      const [fallback] = await db.query(
        `(SELECT 'task_created' AS type, t.title, t.created_at AS happened_at, u.nickname AS actor_name, u.avatar AS actor_avatar
          FROM duijie_tasks t LEFT JOIN voice_users u ON u.id = t.created_by WHERE t.project_id = ? AND t.is_deleted = 0)
         UNION ALL
         (SELECT 'member_joined' AS type, COALESCE(u.nickname, u.username) AS title, pm.created_at AS happened_at, u.nickname AS actor_name, u.avatar AS actor_avatar
          FROM duijie_project_members pm LEFT JOIN voice_users u ON u.id = pm.user_id WHERE pm.project_id = ?)
         ORDER BY happened_at DESC LIMIT 10`,
        [id, id]
      );
      activity = fallback;
    }

    const total = Number(taskStats.total) || 0;
    const completed = Number(taskStats.completed) || 0;

    res.json({
      success: true,
      data: {
        tasks: {
          total,
          completed,
          todo: Number(taskStats.todo) || 0,
          submitted: Number(taskStats.submitted) || 0,
          in_progress: Number(taskStats.in_progress) || 0,
          pending_review: Number(taskStats.pending_review) || 0,
          review_failed: Number(taskStats.review_failed) || 0,
          disputed: Number(taskStats.disputed) || 0,
          overdue: Number(taskStats.overdue) || 0,
          completion_rate: total > 0 ? Math.round(completed / total * 100) : 0,
        },
        members: member_count,
        files: file_count,
        messages: message_count,
        milestones: {
          total: Number(milestone_total) || 0,
          done: Number(milestone_done) || 0,
        },
        activity,
      },
    });
  } catch (e) {
    console.error('project overview error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
