const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility, visible_users } = req.body;

    const [[group]] = await db.query(
      'SELECT * FROM duijie_resource_groups WHERE id = ? AND is_deleted = 0', [id]
    );
    if (!group) return res.status(404).json({ success: false, message: '资料不存在' });
    if (group.created_by !== req.userId) return res.status(403).json({ success: false, message: '只有创建人可以修改' });

    const vis = visibility === 'selected' ? 'selected' : 'all';
    await db.query('UPDATE duijie_resource_groups SET visibility = ? WHERE id = ?', [vis, id]);

    await db.query('DELETE FROM duijie_resource_group_visibility WHERE group_id = ?', [id]);
    if (vis === 'selected' && Array.isArray(visible_users) && visible_users.length > 0) {
      const vals = visible_users.map(uid => [id, uid]);
      await db.query('INSERT INTO duijie_resource_group_visibility (group_id, user_id) VALUES ?', [vals]);
    }

    res.json({ success: true });
  } catch (e) {
    console.error('updateGroup error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
