const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const [[group]] = await db.query(
      'SELECT g.*, u.nickname as creator_name, u.username as creator_username FROM duijie_resource_groups g LEFT JOIN voice_users u ON g.created_by = u.id WHERE g.id = ? AND g.is_deleted = 0',
      [id]
    );
    if (!group) return res.status(404).json({ success: false, message: '资料不存在' });

    if (group.visibility === 'selected' && group.created_by !== req.userId) {
      const [[vis]] = await db.query(
        'SELECT 1 FROM duijie_resource_group_visibility WHERE group_id = ? AND user_id = ?',
        [id, req.userId]
      );
      if (!vis) return res.status(403).json({ success: false, message: '无权查看' });
    }

    const [items] = await db.query(
      'SELECT * FROM duijie_files WHERE resource_group_id = ? AND is_deleted = 0 ORDER BY created_at ASC',
      [id]
    );

    const [visUsers] = await db.query(
      'SELECT v.user_id, u.nickname, u.username FROM duijie_resource_group_visibility v LEFT JOIN voice_users u ON v.user_id = u.id WHERE v.group_id = ?',
      [id]
    );

    res.json({ success: true, data: { ...group, items, visible_users: visUsers } });
  } catch (e) {
    console.error('groupDetail error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
