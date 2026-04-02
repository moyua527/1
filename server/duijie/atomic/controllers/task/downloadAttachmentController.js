const path = require('path');
const fs = require('fs');
const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [[attachment]] = await db.query(
      'SELECT * FROM duijie_task_attachments WHERE id = ?', [req.params.attachmentId]
    );
    if (!attachment) return res.status(404).json({ success: false, message: '附件不存在' });
    const filePath = path.resolve(__dirname, '../../../uploads', attachment.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: '文件不存在' });

    // 图片预览模式：inline 显示而不是强制下载
    if (req.query.preview === '1' && attachment.mime_type?.startsWith('image/')) {
      res.setHeader('Content-Type', attachment.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.original_name || attachment.filename)}"`);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(filePath);
    }

    res.download(filePath, attachment.original_name || attachment.filename);
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
