const path = require('path');
const getFileById = require('../../services/file/getFileById');

module.exports = async (req, res) => {
  try {
    const file = await getFileById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: '文件不存在' });
    const filePath = path.resolve(__dirname, '../../../uploads', file.path || file.name);
    res.download(filePath, file.original_name || file.name);
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
