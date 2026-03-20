const uploadFile = require('../../services/file/uploadFile');

module.exports = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: '未选择文件' });
    const id = await uploadFile({
      project_id: req.body.project_id,
      name: req.file.filename,
      original_name: req.body.original_name || req.file.originalname,
      size: req.file.size,
      mime_type: req.file.mimetype,
      path: req.file.path,
      uploaded_by: req.userId,
    });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
