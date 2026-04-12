const db = require('../../../config/db');
const XLSX = require('xlsx');

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

    const statusMap = { todo: '待办', submitted: '已提出', disputed: '待补充', in_progress: '执行中', pending_review: '待验收', review_failed: '验收不通过', accepted: '验收通过' };
    const priorityMap = { urgent: '紧急', high: '高', medium: '中', low: '低' };

    const header = ['任务标题', '状态', '优先级', '项目', '负责人', '创建者', '截止日期', '创建时间'];
    const rows = tasks.map(t => [
      t.title || '',
      statusMap[t.status] || t.status,
      priorityMap[t.priority] || t.priority || '-',
      t.project_name || '-',
      t.assignee_name || '-',
      t.creator_name || '-',
      t.due_date ? new Date(t.due_date).toLocaleDateString('zh-CN') : '-',
      new Date(t.created_at).toLocaleString('zh-CN'),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '需求列表');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const fname = `tasks_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fname}`);
    res.send(buf);
  } catch (e) {
    res.status(500).json({ success: false, message: '导出失败' });
  }
};
