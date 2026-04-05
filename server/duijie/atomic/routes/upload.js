const multer = require('multer');
const path = require('path');

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.md', '.zip', '.rar', '.7z',
  '.mp4', '.mp3', '.wav',
]);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // 安全：只保留文件名部分，移除路径遍历字符
    const baseName = path.basename(decoded).replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_');
    cb(null, Date.now() + '-' + baseName);
  },
});

function fileFilter(req, file, cb) {
  const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const ext = path.extname(decoded).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) return cb(null, true);
  cb(new Error(`不允许上传 ${ext} 类型的文件`), false);
}

module.exports = multer({ storage, limits: { fileSize: 100 * 1024 * 1024, files: 20 }, fileFilter });
