const updateTask = require('../../services/task/updateTask');
const db = require('../../../config/db');
const { notify } = require('../../utils/notify');
const { broadcast } = require('../../utils/broadcast');

const FIELD_PERM_MAP = {
  title: 'can_edit_task_title',
  description: 'can_edit_task_desc',
  priority: 'can_edit_task_priority',
  deadline: 'can_edit_task_deadline',
  assignee_id: 'can_assign_task',
};

module.exports = async (req, res) => {
  try {
    const taskId = req.params.id;
    const perms = req.projectPerms;
    if (perms && req.userRole !== 'admin') {
      for (const [field, perm] of Object.entries(FIELD_PERM_MAP)) {
        if (req.body[field] !== undefined && !perms[perm]) {
          return res.status(403).json({ success: false, message: `无权修改「${field}」` });
        }
      }
    }
    const [[oldTask]] = await db.query('SELECT * FROM duijie_tasks WHERE id = ? AND is_deleted = 0', [taskId]);
    await updateTask(taskId, req.body);

    if (oldTask && req.body.assignee_id && req.body.assignee_id !== oldTask.assignee_id && req.body.assignee_id !== req.userId) {
      await notify(req.body.assignee_id, 'task_assigned', '任务指派', `你被指派了任务「${oldTask.title}」`, `/tasks`, oldTask.project_id != null ? Number(oldTask.project_id) : null);
    }
    if (oldTask && req.body.status && req.body.status !== oldTask.status && oldTask.created_by && oldTask.created_by !== req.userId) {
      const statusLabel = { todo: '待办', submitted: '已提出', disputed: '待补充', in_progress: '执行中', pending_review: '待验收', review_failed: '验收不通过', accepted: '验收通过' };
      await notify(oldTask.created_by, 'task_status', '任务状态变更', `任务「${oldTask.title}」状态变为「${statusLabel[req.body.status] || req.body.status}」`, `/tasks`, oldTask.project_id != null ? Number(oldTask.project_id) : null);
    }

    broadcast('task', 'updated', { id: taskId, project_id: oldTask?.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
