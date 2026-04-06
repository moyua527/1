const db = require('../../../config/db');
const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    const { project_id, title, content } = req.body;
    if (!project_id || !content?.trim()) return res.status(400).json({ success: false, message: '请填写内容' });
    if (req.userRole !== 'admin') {
      const perms = await getProjectPerms(req.userId, project_id);
      if (!perms?.can_upload_file) return res.status(403).json({ success: false, message: '无上传权限' });
    }

    const displayName = title && title.trim() ? title.trim() : `笔记 ${new Date().toLocaleDateString('zh-CN')}`;
    const text = content.trim();
    const [result] = await db.query(
      `INSERT INTO duijie_files (project_id, name, original_name, size, mime_type, path, uploaded_by)
       VALUES (?, ?, ?, ?, 'text/x-note', ?, ?)`,
      [project_id, `note-${Date.now()}`, displayName, Buffer.byteLength(text, 'utf8'), text, req.userId]
    );

    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    console.error('addNote error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
