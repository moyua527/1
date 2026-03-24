const path = require('path');
const db = require('../../../config/db');

module.exports = async (req, res) => {
  try {
    const [[attachment]] = await db.query(
      'SELECT * FROM duijie_task_attachments WHERE id = ?', [req.params.attachmentId]
    );
    if (!attachment) return res.status(404).json({ success: false, message: '附件不存在' });
    const filePath = path.resolve(__dirname, '../../../uploads', attachment.filename);
    res.download(filePath, attachment.original_name || attachment.filename);
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
