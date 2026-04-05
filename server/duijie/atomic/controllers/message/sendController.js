const sendMessage = require('../../services/message/sendMessage');

module.exports = async (req, res) => {
  try {
    const { project_id, content } = req.body;
    if (!project_id) return res.status(400).json({ success: false, message: '缺少项目ID' });

    if (req.file) {
      const id = await sendMessage({
        project_id, sender_id: req.userId,
        content: req.file.filename, type: 'file',
      });
      return res.json({ success: true, data: { id } });
    }

    if (!content || !content.trim()) return res.status(400).json({ success: false, message: '消息内容不能为空' });
    const id = await sendMessage({ project_id, sender_id: req.userId, content: content.trim() });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
