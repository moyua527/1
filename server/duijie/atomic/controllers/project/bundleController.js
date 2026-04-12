const db = require('../../../config/db');
const getProjectDetail = require('../../services/project/getProjectDetail');
const listTasks = require('../../services/task/listTasks');
const { ensureDefaultProjectRoles } = require('../../utils/projectRoles');

module.exports = async (req, res) => {
  try {
    const projectId = req.params.id;
    const uid = req.userId;
    const role = req.userRole;

    const project = await getProjectDetail(projectId);
    if (!project) return res.status(404).json({ success: false, message: '项目不存在' });

    let allowed = false;
    if (role === 'admin') {
      allowed = true;
    } else {
      const [rows] = await db.query(
        'SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ? UNION SELECT 1 FROM duijie_projects WHERE id = ? AND created_by = ?',
        [projectId, uid, projectId, uid]
      );
      allowed = rows.length > 0;
    }
    if (!allowed) return res.status(403).json({ success: false, message: '无权访问此项目' });

    const [tasks, joinRequests, roles] = await Promise.all([
      listTasks(projectId, { role, userId: uid, activeEnterpriseId: req.activeEnterpriseId })
        .then(async data => {
          if (data.length === 0) return data;
          const ids = data.map(t => t.id);
          const ph = ids.map(() => '?').join(',');
          const [attachments] = await db.query(
            `SELECT id, task_id, filename, original_name, file_size, mime_type, created_at FROM duijie_task_attachments WHERE task_id IN (${ph})`, ids
          );
          const [reviewPoints] = await db.query(
            `SELECT rp.*, u.nickname AS author_name, ru.nickname AS responder_name
             FROM duijie_task_review_points rp
             LEFT JOIN voice_users u ON u.id = rp.author_id
             LEFT JOIN voice_users ru ON ru.id = rp.response_by
             WHERE rp.task_id IN (${ph})
             ORDER BY rp.created_at ASC`, ids
          );
          const attMap = {};
          attachments.forEach(a => { (attMap[a.task_id] = attMap[a.task_id] || []).push(a); });
          const rpMap = {};
          reviewPoints.forEach(rp => { (rpMap[rp.task_id] = rpMap[rp.task_id] || []).push(rp); });
          data.forEach(t => {
            t.attachments = attMap[t.id] || [];
            t.review_points = rpMap[t.id] || [];
          });
          return data;
        }),

      db.query(
        `SELECT jr.id, jr.project_id, jr.user_id, jr.message, jr.status, jr.created_at, jr.reviewed_at,
                jr.invited_by, jr.invite_type,
                u.nickname, u.username, u.phone,
                rv.nickname AS reviewer_name,
                inv.nickname AS inviter_name
         FROM duijie_project_join_requests jr
         LEFT JOIN voice_users u ON u.id = jr.user_id
         LEFT JOIN voice_users rv ON rv.id = jr.reviewed_by
         LEFT JOIN voice_users inv ON inv.id = jr.invited_by
         WHERE jr.project_id = ?
         ORDER BY FIELD(jr.status, 'pending', 'approved', 'rejected'), jr.created_at DESC`,
        [projectId]
      ).then(([rows]) => rows),

      ensureDefaultProjectRoles(projectId, uid).then(async () => {
        const [roleRows] = await db.query(
          `SELECT * FROM project_roles WHERE is_deleted = 0 AND project_id = ? ORDER BY sort_order ASC, id ASC`,
          [projectId]
        );
        const [counts] = await db.query(
          'SELECT project_role_id, COUNT(*) as cnt FROM duijie_project_members WHERE project_id = ? AND project_role_id IS NOT NULL GROUP BY project_role_id',
          [projectId]
        );
        const countMap = {};
        counts.forEach(r => { countMap[r.project_role_id] = r.cnt; });
        roleRows.forEach(r => { r.member_count = countMap[r.id] || 0; });
        return roleRows;
      }),
    ]);

    res.json({
      success: true,
      data: { project, tasks, joinRequests, roles },
    });
  } catch (e) {
    console.error('project bundle error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
