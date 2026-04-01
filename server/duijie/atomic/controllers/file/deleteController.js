const deleteFile = require('../../services/file/deleteFile');
const getFileById = require('../../services/file/getFileById');

module.exports = async (req, res) => {
  try {
    const file = await getFileById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: '文件不存在' });
    if (req.userRole !== 'admin' && file.uploaded_by !== req.userId) {
      return res.status(403).json({ success: false, message: '只能删除自己上传的文件' });
    }
    await deleteFile(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
