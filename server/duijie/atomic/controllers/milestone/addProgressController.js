const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: '请输入跟踪内容' });

    const [[ms]] = await db.query(
      'SELECT id, project_id, created_by FROM duijie_milestones WHERE id = ? AND is_deleted = 0',
      [id]
    );
    if (!ms) return res.status(404).json({ success: false, message: '代办不存在' });

    const [[participant]] = await db.query(
      'SELECT id FROM duijie_milestone_participants WHERE milestone_id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (ms.created_by !== req.userId && !participant) {
      return res.status(403).json({ success: false, message: '只有发起人和参与人可以跟进' });
    }

    const [result] = await db.query(
      'INSERT INTO duijie_milestone_progress (milestone_id, content, created_by) VALUES (?, ?, ?)',
      [id, content.trim(), req.userId]
    );

    const [[row]] = await db.query(
      `SELECT p.*, u.display_name AS author_name
       FROM duijie_milestone_progress p
       LEFT JOIN voice_users u ON u.id = p.created_by
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.json({ success: true, data: row });
  } catch (e) {
    console.error('addProgress error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
