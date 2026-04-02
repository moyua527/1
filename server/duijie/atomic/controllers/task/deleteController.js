const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT project_id FROM duijie_tasks WHERE id = ? AND is_deleted = 0', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: '任务不存在' });
    await db.query('UPDATE duijie_tasks SET is_deleted = 1 WHERE id = ?', [req.params.id]);
    broadcast('task', 'deleted', { id: req.params.id, project_id: rows[0].project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
