const uploadFile = require('../../services/file/uploadFile');
const { getProjectPerms } = require('../../utils/projectPerms');
const { logActivity } = require('../../utils/activityLogger');

module.exports = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: '未选择文件' });
    if (req.userRole !== 'admin' && req.body.project_id) {
      const perms = await getProjectPerms(req.userId, req.body.project_id);
      if (!perms?.can_upload_file) return res.status(403).json({ success: false, message: '无上传文件权限' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    const id = await uploadFile({
      project_id: req.body.project_id,
      name: req.file.filename,
      original_name: req.body.original_name || req.file.originalname,
      size: req.file.size,
      mime_type: req.file.mimetype,
      path: filePath,
      uploaded_by: req.userId,
    });
    if (req.body.project_id) {
      logActivity(req.body.project_id, req.userId, 'file_uploaded', { entityType: 'file', entityId: id, title: req.body.original_name || req.file.originalname });
    }
    res.json({ success: true, data: { id, url: filePath } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
