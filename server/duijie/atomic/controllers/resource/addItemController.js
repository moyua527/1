const db = require('../../../config/db');
const path = require('path');
const fs = require('fs');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    const { group_id, type, content, url, title } = req.body;
    if (!group_id) return res.status(400).json({ success: false, message: '缺少 group_id' });

    const [[group]] = await db.query('SELECT * FROM duijie_resource_groups WHERE id = ? AND is_deleted = 0', [group_id]);
    if (!group) return res.status(404).json({ success: false, message: '资料组不存在' });
    if (group.created_by !== req.userId) return res.status(403).json({ success: false, message: '只有创建人可以添加内容' });

    if (type === 'url') {
      if (!url?.trim()) return res.status(400).json({ success: false, message: '请输入网址' });
      const displayName = title?.trim() || url.trim();
      const desc = content?.trim() || '';
      await db.query(
        "INSERT INTO duijie_files (project_id, resource_group_id, name, original_name, size, mime_type, path, description, uploaded_by) VALUES (?, ?, ?, ?, 0, 'text/x-url', ?, ?, ?)",
        [group.project_id, group_id, `url-${Date.now()}`, displayName, url.trim(), desc, req.userId]
      );
    } else if (type === 'text') {
      if (!content?.trim()) return res.status(400).json({ success: false, message: '请输入文字内容' });
      const displayName = title?.trim() || content.trim().substring(0, 50);
      await db.query(
        "INSERT INTO duijie_files (project_id, resource_group_id, name, original_name, size, mime_type, path, uploaded_by) VALUES (?, ?, ?, ?, 0, 'text/x-note', ?, ?)",
        [group.project_id, group_id, `note-${Date.now()}`, displayName, content.trim(), req.userId]
      );
    } else if (type === 'file' && req.file) {
      const uploadDir = path.join(__dirname, '../../../../uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, req.file.buffer);
      await db.query(
        'INSERT INTO duijie_files (project_id, resource_group_id, name, original_name, size, mime_type, path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [group.project_id, group_id, fileName, req.file.originalname, req.file.size, req.file.mimetype, `/uploads/${fileName}`, req.userId]
      );
    } else {
      return res.status(400).json({ success: false, message: '无效的类型' });
    }

    broadcast('file', 'created', { project_id: group.project_id, userId: req.userId });
    res.json({ success: true });
  } catch (e) {
    console.error('addItem error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
