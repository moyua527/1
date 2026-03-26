const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const uid = req.userId;
    const role = req.userRole;
    const projectId = req.query.project_id;

    let where = 't.is_deleted = 0';
    const params = [];

    if (projectId) {
      where += ' AND t.project_id = ?';
      params.push(projectId);
    }

    if (role !== 'admin') {
      where += ' AND (t.assignee_id = ? OR t.project_id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';
      params.push(uid, uid);
    }

    const [tasks] = await db.query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.created_at,
              p.name as project_name,
              creator.nickname as creator_name,
              assignee.nickname as assignee_name
       FROM duijie_tasks t
       LEFT JOIN duijie_projects p ON p.id = t.project_id
       LEFT JOIN voice_users creator ON creator.id = t.created_by
       LEFT JOIN voice_users assignee ON assignee.id = t.assignee_id
       WHERE ${where}
       ORDER BY t.created_at DESC`,
      params
    );

    const statusMap = { todo: '待办', in_progress: '进行中', pending_review: '待验收', accepted: '已完成', done: '已完成' };
    const priorityMap = { urgent: '紧急', high: '高', medium: '中', low: '低' };

    const BOM = '\uFEFF';
    const header = '任务标题,状态,优先级,项目,负责人,创建者,截止日期,创建时间\n';
    const rows = tasks.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      statusMap[t.status] || t.status,
      priorityMap[t.priority] || t.priority || '-',
      `"${(t.project_name || '-').replace(/"/g, '""')}"`,
      t.assignee_name || '-',
      t.creator_name || '-',
      t.due_date ? new Date(t.due_date).toLocaleDateString('zh-CN') : '-',
      new Date(t.created_at).toLocaleString('zh-CN'),
    ].join(',')).join('\n');

    const csv = BOM + header + rows;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    res.send(csv);
  } catch (e) {
    res.status(500).json({ success: false, message: '导出失败' });
  }
};
