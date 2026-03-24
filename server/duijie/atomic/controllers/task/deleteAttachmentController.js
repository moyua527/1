const db = require('../../../config/db');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const [[att]] = await db.query('SELECT * FROM duijie_task_attachments WHERE id = ?', [attachmentId]);
    if (!att) return res.status(404).json({ success: false, message: '附件不存在' });

    await db.query('DELETE FROM duijie_task_attachments WHERE id = ?', [attachmentId]);

    const filePath = path.join(__dirname, '../../../../uploads', att.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
