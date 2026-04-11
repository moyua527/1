const deleteFile = require('../../services/file/deleteFile');
const getFileById = require('../../services/file/getFileById');
const { getProjectPerms } = require('../../utils/projectPerms');
const { logActivity } = require('../../utils/activityLogger');

module.exports = async (req, res) => {
  try {
    const file = await getFileById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: '文件不存在' });
    if (req.userRole !== 'admin' && file.uploaded_by !== req.userId) {
      const perms = file.project_id ? await getProjectPerms(req.userId, file.project_id) : null;
      if (!perms?.can_delete_file) return res.status(403).json({ success: false, message: '无删除文件权限' });
    }
    await deleteFile(req.params.id);
    if (file.project_id) {
      logActivity(file.project_id, req.userId, 'file_deleted', { entityType: 'file', entityId: Number(req.params.id), title: file.original_name || file.name });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
