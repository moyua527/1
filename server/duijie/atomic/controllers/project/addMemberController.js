const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: '请选择用户' });
    const validRoles = ['owner', 'editor', 'viewer'];
    const memberRole = validRoles.includes(role) ? role : 'editor';

    const [[existing]] = await db.query(
      'SELECT 1 FROM duijie_project_members WHERE project_id = ? AND user_id = ?', [id, user_id]
    );
    if (existing) return res.status(400).json({ success: false, message: '该用户已是项目成员' });

    await db.query(
      'INSERT INTO duijie_project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [id, user_id, memberRole]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
