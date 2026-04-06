const db = require('../../../config/db');
const { getProjectPerms } = require('../../utils/projectPerms');

module.exports = async (req, res) => {
  try {
    const { project_id, title, url, description } = req.body;
    if (!project_id || !url) return res.status(400).json({ success: false, message: '请填写网址' });
    if (req.userRole !== 'admin') {
      const perms = await getProjectPerms(req.userId, project_id);
      if (!perms?.can_upload_file) return res.status(403).json({ success: false, message: '无上传权限' });
    }

    const displayName = title && title.trim() ? title.trim() : url;
    const desc = description && description.trim() ? description.trim() : '';
    const [result] = await db.query(
      `INSERT INTO duijie_files (project_id, name, original_name, size, mime_type, path, description, uploaded_by)
       VALUES (?, ?, ?, 0, 'text/x-url', ?, ?, ?)`,
      [project_id, `url-${Date.now()}`, displayName, url, desc, req.userId]
    );

    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    console.error('addUrl error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
