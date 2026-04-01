const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { role, enterprise_role_id } = req.body;

    const [[member]] = await db.query(
      'SELECT * FROM duijie_project_members WHERE id = ? AND project_id = ?',
      [memberId, id]
    );
    if (!member) return res.status(404).json({ success: false, message: '成员不存在' });

    const sets = [];
    const vals = [];
    if (role) {
      const validRoles = ['owner', 'editor', 'viewer'];
      if (!validRoles.includes(role)) return res.status(400).json({ success: false, message: '无效的角色' });
      sets.push('role = ?');
      vals.push(role);
    }
    if (enterprise_role_id !== undefined) {
      sets.push('enterprise_role_id = ?');
      vals.push(enterprise_role_id || null);
    }
    if (!sets.length) return res.json({ success: true });

    vals.push(memberId, id);
    await db.query(`UPDATE duijie_project_members SET ${sets.join(', ')} WHERE id = ? AND project_id = ?`, vals);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
