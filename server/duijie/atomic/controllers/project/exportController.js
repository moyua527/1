const db = require('../../../config/db');
const XLSX = require('xlsx');

module.exports = async (req, res) => {
  try {
    const uid = req.userId;
    const role = req.userRole;

    let pf = 'AND (p.created_by = ? OR p.id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ?))';
    let params = [uid, uid];
    if (role === 'admin') { pf = ''; params = []; }

    const [projects] = await db.query(
      `SELECT p.id, p.name, p.status, p.description, p.created_at, p.updated_at,
              u.nickname as creator_name,
              c.name as client_name,
              ic.name as internal_client_name,
              (SELECT COUNT(*) FROM duijie_tasks WHERE project_id = p.id AND is_deleted = 0) as task_count,
              (SELECT COUNT(*) FROM duijie_tasks WHERE project_id = p.id AND is_deleted = 0 AND status = 'accepted') as done_count,
              (SELECT COUNT(*) FROM duijie_project_members WHERE project_id = p.id) as member_count
       FROM duijie_projects p
       LEFT JOIN voice_users u ON u.id = p.created_by
       LEFT JOIN duijie_clients c ON c.id = p.client_id
       LEFT JOIN duijie_clients ic ON ic.id = p.internal_client_id
       WHERE p.is_deleted = 0 ${pf}
       ORDER BY p.created_at DESC`,
      params
    );

    const statusMap = { planning: '规划中', in_progress: '进行中', completed: '已完成', on_hold: '暂停' };

    const header = ['项目名称', '状态', '我方企业', '客户企业', '创建者', '任务总数', '已完成', '成员数', '创建时间', '更新时间'];
    const rows = projects.map(p => [
      p.name || '',
      statusMap[p.status] || p.status,
      p.internal_client_name || '-',
      p.client_name || '-',
      p.creator_name || '-',
      p.task_count,
      p.done_count,
      p.member_count,
      new Date(p.created_at).toLocaleString('zh-CN'),
      new Date(p.updated_at).toLocaleString('zh-CN'),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [{ wch: 24 }, { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '项目列表');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const fname = `projects_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fname}`);
    res.send(buf);
  } catch (e) {
    res.status(500).json({ success: false, message: '导出失败' });
  }
};
