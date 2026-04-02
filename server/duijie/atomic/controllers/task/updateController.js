const updateTask = require('../../services/task/updateTask');
const db = require('../../../config/db');
const { notify } = require('../../utils/notify');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const taskId = req.params.id;
    const [[oldTask]] = await db.query('SELECT * FROM duijie_tasks WHERE id = ? AND is_deleted = 0', [taskId]);
    await updateTask(taskId, req.body);

    if (oldTask && req.body.assignee_id && req.body.assignee_id !== oldTask.assignee_id && req.body.assignee_id !== req.userId) {
      await notify(req.body.assignee_id, 'task_assigned', '任务指派', `你被指派了任务「${oldTask.title}」`, `/tasks`);
    }
    if (oldTask && req.body.status && req.body.status !== oldTask.status && oldTask.created_by && oldTask.created_by !== req.userId) {
      const statusLabel = { todo: '待办', submitted: '已提出', disputed: '待补充', in_progress: '执行中', pending_review: '待验收', review_failed: '验收不通过', accepted: '验收通过' };
      await notify(oldTask.created_by, 'task_status', '任务状态变更', `任务「${oldTask.title}」状态变为「${statusLabel[req.body.status] || req.body.status}」`, `/tasks`);
    }

    broadcast('task', 'updated', { id: taskId, project_id: oldTask?.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
