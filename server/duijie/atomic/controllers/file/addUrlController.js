const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const { project_id, title, url } = req.body;
    if (!project_id || !url) return res.status(400).json({ success: false, message: '请填写网址' });

    const displayName = title && title.trim() ? title.trim() : url;
    const [result] = await db.query(
      `INSERT INTO duijie_files (project_id, name, original_name, size, mime_type, path, uploaded_by)
       VALUES (?, ?, ?, 0, 'text/x-url', ?, ?)`,
      [project_id, `url-${Date.now()}`, displayName, url, req.userId]
    );

    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    console.error('addUrl error:', e);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
