const createTask = require('../../services/task/createTask');
const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { notify, notifyMany } = require('../../utils/notify');
const { logActivity } = require('../../utils/activityLogger');

module.exports = async (req, res) => {
  try {
    const id = await createTask({ ...req.body, created_by: req.userId });
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        await db.query(
          'INSERT INTO duijie_task_attachments (task_id, filename, original_name, file_size, mime_type, created_by) VALUES (?,?,?,?,?,?)',
          [id, f.filename, Buffer.from(f.originalname, 'latin1').toString('utf8'), f.size, f.mimetype, req.userId]
        );
      }
    }

    let draftFileNames = [];
    try { draftFileNames = JSON.parse(req.body.draft_files || '[]') } catch {}
    if (Array.isArray(draftFileNames) && draftFileNames.length > 0 && req.body.from_draft_id) {
      const [draftRows] = await db.query(
        'SELECT files FROM duijie_task_drafts WHERE id = ? AND user_id = ?',
        [req.body.from_draft_id, req.userId]
      );
      if (draftRows.length) {
        let draftMeta = draftRows[0].files;
        if (typeof draftMeta === 'string') try { draftMeta = JSON.parse(draftMeta) } catch { draftMeta = [] }
        if (Array.isArray(draftMeta)) {
          for (const dm of draftMeta) {
            if (draftFileNames.includes(dm.filename)) {
              await db.query(
                'INSERT INTO duijie_task_attachments (task_id, filename, original_name, file_size, mime_type, created_by) VALUES (?,?,?,?,?,?)',
                [id, dm.filename, dm.original_name, dm.size, dm.mime_type, req.userId]
              );
            }
          }
        }
      }
    }

    let projectName = '';
    if (req.body.project_id) {
      const [[proj]] = await db.query('SELECT name FROM duijie_projects WHERE id = ?', [req.body.project_id]);
      projectName = proj?.name || '';
    }
    const pPrefix = projectName ? `【${projectName}】` : '';

    if (req.body.assignee_id && req.body.assignee_id !== req.userId) {
      await notify(req.body.assignee_id, 'task_assigned', '新任务指派', `${pPrefix}你被指派了任务「${req.body.title}」`, `/tasks`, req.body.project_id != null ? Number(req.body.project_id) : null);
    }

    if (req.body.project_id) {
      const [members] = await db.query(
        'SELECT user_id FROM duijie_project_members WHERE project_id = ? AND user_id != ?',
        [req.body.project_id, req.userId]
      );
      const otherIds = members
        .map(m => m.user_id)
        .filter(uid => uid !== Number(req.body.assignee_id));
      if (otherIds.length > 0) {
        await notifyMany(otherIds, 'task_assigned', '新需求', `${pPrefix}有新需求「${req.body.title}」`, `/tasks`, Number(req.body.project_id));
      }
    }

    if (req.body.project_id) {
      logActivity(req.body.project_id, req.userId, 'task_created', { entityType: 'task', entityId: id, title: req.body.title });
    }
    broadcast('task', 'created', { id, project_id: req.body.project_id, userId: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
