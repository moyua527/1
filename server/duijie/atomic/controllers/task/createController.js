const createTask = require('../../services/task/createTask');
const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { notify, notifyMany } = require('../../utils/notify');

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

    if (req.body.assignee_id && req.body.assignee_id !== req.userId) {
      await notify(req.body.assignee_id, 'task_assigned', '新任务指派', `你被指派了任务「${req.body.title}」`, `/tasks`);
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
        await notifyMany(otherIds, 'task_assigned', '新需求', `项目有新需求「${req.body.title}」`, `/tasks`);
      }
    }

    broadcast('task', 'created', { id, project_id: req.body.project_id, userId: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
