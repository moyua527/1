const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const uid = req.userId;

    // 我的待办任务（未完成，分配给我或我创建的）
    const [myTasks] = await db.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.project_id,
              p.name as project_name
       FROM duijie_tasks t
       LEFT JOIN duijie_projects p ON p.id = t.project_id
       WHERE t.is_deleted = 0 AND t.assignee_id = ? AND t.status IN ('todo', 'in_progress', 'pending_review')
       ORDER BY FIELD(t.priority, 'urgent', 'high', 'medium', 'low'), t.due_date ASC
       LIMIT 10`,
      [uid]
    );

    // 我参与的项目最近动态（最近更新的项目）
    const [myProjects] = await db.query(
      `SELECT p.id, p.name, p.status, p.updated_at,
              (SELECT COUNT(*) FROM duijie_tasks WHERE project_id = p.id AND is_deleted = 0 AND status IN ('todo','in_progress')) as open_tasks,
              (SELECT COUNT(*) FROM duijie_tasks WHERE project_id = p.id AND is_deleted = 0 AND status = 'accepted') as done_tasks
       FROM duijie_projects p
       INNER JOIN duijie_project_members pm ON pm.project_id = p.id AND pm.user_id = ?
       WHERE p.is_deleted = 0
       ORDER BY p.updated_at DESC
       LIMIT 5`,
      [uid]
    );

    // 待审批事项（企业加入申请 - 仅管理员/创建者可见）
    let pendingApprovals = [];
    const [entRows] = await db.query(
      `SELECT c.id FROM duijie_clients c WHERE c.user_id = ? AND c.client_type = 'company' AND c.is_deleted = 0`,
      [uid]
    );
    if (entRows.length > 0) {
      const entIds = entRows.map(e => e.id);
      const [approvals] = await db.query(
        `SELECT r.id, r.user_id, r.created_at, r.client_id,
                u.nickname, u.username, u.avatar,
                c.name as enterprise_name
         FROM duijie_join_requests r
         LEFT JOIN voice_users u ON u.id = r.user_id
         LEFT JOIN duijie_clients c ON c.id = r.client_id
         WHERE r.client_id IN (?) AND r.status = 'pending'
         ORDER BY r.created_at DESC LIMIT 10`,
        [entIds]
      );
      pendingApprovals = approvals;
    }

    // 即将到期的任务（3天内）
    const [dueSoon] = await db.query(
      `SELECT t.id, t.title, t.due_date, t.priority, p.name as project_name
       FROM duijie_tasks t
       LEFT JOIN duijie_projects p ON p.id = t.project_id
       WHERE t.is_deleted = 0 AND t.assignee_id = ? AND t.status IN ('todo', 'in_progress')
         AND t.due_date IS NOT NULL AND t.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
       ORDER BY t.due_date ASC LIMIT 5`,
      [uid]
    );

    // 未读通知数
    const [[{ unreadNotifs }]] = await db.query(
      'SELECT COUNT(*) as unreadNotifs FROM duijie_notifications WHERE user_id = ? AND is_read = 0',
      [uid]
    );

    res.json({
      success: true,
      data: {
        myTasks,
        myProjects,
        pendingApprovals,
        dueSoon,
        unreadNotifs,
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
