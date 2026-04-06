const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');
const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const [[existing]] = await db.query('SELECT project_id FROM duijie_milestones WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: '代办不存在' });
    if (req.userRole !== 'admin') {
      const perms = await getProjectPerms(req.userId, existing.project_id);
      if (!perms?.can_edit_milestone) return res.status(403).json({ success: false, message: '无代办编辑权限' });
    }
    const { title, description, due_date } = req.body;
    const sets = [];
    const vals = [];
    if (title !== undefined) { sets.push('title = ?'); vals.push(title); }
    if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
    if (due_date !== undefined) { sets.push('due_date = ?'); vals.push(due_date || null); }
    if (!sets.length) return res.status(400).json({ success: false, message: '没有要更新的字段' });
    vals.push(id);
    await db.query(`UPDATE duijie_milestones SET ${sets.join(', ')} WHERE id = ?`, vals);
    broadcast('milestone', 'updated', { project_id: existing.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
