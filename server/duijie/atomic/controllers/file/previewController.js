const path = require('path');
const getFileById = require('../../services/file/getFileById');

const previewMimes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
  'application/pdf',
  'text/plain', 'text/html', 'text/css', 'text/csv',
  'application/json',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
];

module.exports = async (req, res) => {
  try {
    const file = await getFileById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: '文件不存在' });

    const mime = file.mime_type || 'application/octet-stream';
    const canPreview = previewMimes.some(m => mime.startsWith(m.split('/')[0]) || mime === m);
    if (!canPreview) return res.status(400).json({ success: false, message: '该文件类型不支持预览' });

    const filePath = path.resolve(__dirname, '../../../uploads', file.path || file.name);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name || file.name)}"`);
    res.sendFile(filePath);
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
