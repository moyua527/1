const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { itemId } = req.params;
    const [[item]] = await db.query(
      'SELECT f.*, g.created_by as group_creator, g.project_id FROM duijie_files f JOIN duijie_resource_groups g ON g.id = f.resource_group_id WHERE f.id = ? AND f.is_deleted = 0',
      [itemId]
    );
    if (!item) return res.status(404).json({ success: false, message: '条目不存在' });
    if (item.group_creator !== req.userId) return res.status(403).json({ success: false, message: '只有资料组创建人可以删除' });

    await db.query('UPDATE duijie_files SET is_deleted = 1 WHERE id = ?', [itemId]);
    broadcast('file', 'deleted', { project_id: item.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('deleteItem error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
