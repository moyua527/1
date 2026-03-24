const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, follow_type, next_follow_date } = req.body;
    const sets = [];
    const vals = [];
    if (content !== undefined) { sets.push('content = ?'); vals.push(content); }
    if (follow_type !== undefined) { sets.push('follow_type = ?'); vals.push(follow_type); }
    if (next_follow_date !== undefined) { sets.push('next_follow_date = ?'); vals.push(next_follow_date || null); }
    if (!sets.length) return res.status(400).json({ success: false, message: '没有要更新的字段' });
    vals.push(id);
    await db.query(`UPDATE duijie_follow_ups SET ${sets.join(', ')} WHERE id = ?`, vals);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
