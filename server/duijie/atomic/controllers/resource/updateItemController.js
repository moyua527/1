const db = require('../../../config/db');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { title, url, content, description } = req.body;

    const [[item]] = await db.query(
      'SELECT f.*, g.created_by as group_creator, g.project_id FROM duijie_files f JOIN duijie_resource_groups g ON g.id = f.resource_group_id WHERE f.id = ? AND f.is_deleted = 0',
      [itemId]
    );
    if (!item) return res.status(404).json({ success: false, message: '条目不存在' });
    if (item.group_creator !== req.userId) return res.status(403).json({ success: false, message: '只有资料组创建人可以修改' });

    const updates = [];
    const params = [];

    if (item.mime_type === 'text/x-url') {
      if (title !== undefined) { updates.push('original_name = ?'); params.push(title.trim() || item.original_name); }
      if (url !== undefined && url.trim()) { updates.push('path = ?'); params.push(url.trim()); }
      if (description !== undefined) { updates.push('description = ?'); params.push(description.trim()); }
    } else if (item.mime_type === 'text/x-note') {
      if (title !== undefined) { updates.push('original_name = ?'); params.push(title.trim() || item.original_name); }
      if (content !== undefined && content.trim()) { updates.push('path = ?'); params.push(content.trim()); }
    }

    if (updates.length === 0) return res.status(400).json({ success: false, message: '没有需要更新的内容' });

    params.push(itemId);
    await db.query(`UPDATE duijie_files SET ${updates.join(', ')} WHERE id = ?`, params);
    broadcast('file', 'updated', { project_id: item.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('updateItem error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
