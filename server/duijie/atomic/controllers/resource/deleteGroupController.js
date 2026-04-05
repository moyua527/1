const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const [[group]] = await db.query('SELECT * FROM duijie_resource_groups WHERE id = ? AND is_deleted = 0', [id]);
    if (!group) return res.status(404).json({ success: false, message: '资料不存在' });

    await db.query('UPDATE duijie_resource_groups SET is_deleted = 1 WHERE id = ?', [id]);
    await db.query('UPDATE duijie_files SET is_deleted = 1 WHERE resource_group_id = ?', [id]);

    broadcast('file', 'deleted', { project_id: group.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('deleteGroup error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
