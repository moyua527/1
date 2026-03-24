const createTag = require('../../services/tag/createTag');

module.exports = async (req, res) => {
  try {
    const id = await createTag(req.body);
    res.json({ success: true, data: { id } });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: '标签已存在' });
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
