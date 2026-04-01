const moveTask = require('../../services/task/moveTask');
const { broadcast } = require('../../utils/broadcast');
const db = require('../../../config/db');

/** 允许的状态转移 */
const ALLOWED_TRANSITIONS = {
  todo: ['in_progress'],
  in_progress: ['todo', 'pending_review'],
  pending_review: ['in_progress', 'accepted'],
  accepted: [],
};

module.exports = async (req, res) => {
  try {
    const newStatus = req.body.status;
    if (newStatus) {
      const [rows] = await db.query('SELECT status FROM duijie_tasks WHERE id = ? AND is_deleted = 0', [req.params.id]);
      if (!rows[0]) return res.status(404).json({ success: false, message: '任务不存在' });
      const current = rows[0].status;
      const allowed = ALLOWED_TRANSITIONS[current] || [];
      if (current !== newStatus && !allowed.includes(newStatus)) {
        return res.status(422).json({ success: false, message: `不允许从「${current}」转移到「${newStatus}」`, code: 42201 });
      }
    }
    await moveTask(req.params.id, req.body.status, req.body.sort_order);
    broadcast('task', 'updated', { id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
