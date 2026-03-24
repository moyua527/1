const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date } = req.body;
    const sets = [];
    const vals = [];
    if (title !== undefined) { sets.push('title = ?'); vals.push(title); }
    if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
    if (due_date !== undefined) { sets.push('due_date = ?'); vals.push(due_date || null); }
    if (!sets.length) return res.status(400).json({ success: false, message: '没有要更新的字段' });
    vals.push(id);
    await db.query(`UPDATE duijie_milestones SET ${sets.join(', ')} WHERE id = ?`, vals);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
