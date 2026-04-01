const path = require('path');
const getFileById = require('../../services/file/getFileById');
const { canAccessFile } = require('../../utils/fileAccess');

module.exports = async (req, res) => {
  try {
    const file = await getFileById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: '文件不存在' });
    if (!(await canAccessFile(req.userId, req.userRole, file))) {
      return res.status(403).json({ success: false, message: '无权访问此文件' });
    }
    const filePath = path.resolve(__dirname, '../../../uploads', file.path || file.name);
    res.download(filePath, file.original_name || file.name);
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
