const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ success: false, message: '缺少 project_id' });

    const [groups] = await db.query(
      `SELECT g.*, u.nickname as creator_name, u.username as creator_username,
        (SELECT COUNT(*) FROM duijie_files f WHERE f.resource_group_id = g.id AND f.is_deleted = 0) as item_count
       FROM duijie_resource_groups g
       LEFT JOIN voice_users u ON g.created_by = u.id
       WHERE g.project_id = ? AND g.is_deleted = 0
       ORDER BY g.created_at DESC`,
      [project_id]
    );

    const uid = req.userId;
    const visible = groups.filter(g => {
      if (g.visibility === 'all') return true;
      if (g.created_by === uid) return true;
      return false;
    });

    if (visible.some(g => g.visibility === 'selected' && g.created_by !== uid)) {
      const selectedIds = visible.filter(g => g.visibility === 'selected' && g.created_by !== uid).map(g => g.id);
      if (selectedIds.length > 0) {
        const [vis] = await db.query(
          'SELECT group_id FROM duijie_resource_group_visibility WHERE group_id IN (?) AND user_id = ?',
          [selectedIds, uid]
        );
        const allowedIds = new Set(vis.map(v => v.group_id));
        const result = visible.filter(g => g.visibility === 'all' || g.created_by === uid || allowedIds.has(g.id));
        return res.json({ success: true, data: result });
      }
    }

    res.json({ success: true, data: visible });
  } catch (e) {
    console.error('listGroups error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
