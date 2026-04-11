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
      FROM duijie_tasks WHERE project_id = ? AND is_deleted = 0`,
      [id]
    );

    const [memberStats] = await db.query(
      `SELECT
        u.id AS user_id, u.nickname, u.username, u.avatar,
        COUNT(t.id) AS total,
        SUM(t.status IN ('accepted','done')) AS completed,
        SUM(t.status = 'in_progress') AS in_progress,
        SUM(t.status = 'pending_review') AS pending_review,
        SUM(t.due_date IS NOT NULL AND t.due_date < CURDATE() AND t.status NOT IN ('accepted','done')) AS overdue
      FROM duijie_project_members pm
      JOIN voice_users u ON u.id = pm.user_id
      LEFT JOIN duijie_tasks t ON t.assignee_id = u.id AND t.project_id = ? AND t.is_deleted = 0
      WHERE pm.project_id = ?
      GROUP BY u.id ORDER BY completed DESC, total DESC`,
      [id, id]
    );

    const [trend] = await db.query(
      `SELECT DATE(created_at) AS date,
              COUNT(*) AS created,
              SUM(status IN ('accepted','done')) AS completed
       FROM duijie_tasks
       WHERE project_id = ? AND is_deleted = 0 AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at) ORDER BY date`,
      [id]
    );

    const total = Number(taskStats.total) || 0;
    const completed = Number(taskStats.completed) || 0;
    const overdue = Number(taskStats.overdue) || 0;

    res.json({
      success: true,
      data: {
        summary: {
          total,
          completed,
          overdue,
          completion_rate: total > 0 ? Math.round(completed / total * 100) : 0,
          overdue_rate: total > 0 ? Math.round(overdue / total * 100) : 0,
        },
        distribution: [
          { status: 'completed', count: completed },
          { status: 'in_progress', count: Number(taskStats.in_progress) || 0 },
          { status: 'pending_review', count: Number(taskStats.pending_review) || 0 },
          { status: 'submitted', count: Number(taskStats.submitted) || 0 },
          { status: 'todo', count: Number(taskStats.todo) || 0 },
          { status: 'disputed', count: Number(taskStats.disputed) || 0 },
          { status: 'review_failed', count: Number(taskStats.review_failed) || 0 },
        ].filter(d => d.count > 0),
        members: memberStats.map(m => ({
          user_id: m.user_id,
          nickname: m.nickname || m.username,
          avatar: m.avatar,
          total: Number(m.total) || 0,
          completed: Number(m.completed) || 0,
          in_progress: Number(m.in_progress) || 0,
          pending_review: Number(m.pending_review) || 0,
          overdue: Number(m.overdue) || 0,
        })),
        trend: trend.map(t => ({
          date: String(t.date).slice(5, 10),
          created: Number(t.created) || 0,
          completed: Number(t.completed) || 0,
        })),
      },
    });
  } catch (e) {
    console.error('project stats error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
