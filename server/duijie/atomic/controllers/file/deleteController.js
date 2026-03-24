const deleteFile = require('../../services/file/deleteFile');

module.exports = async (req, res) => {
  try {
    await deleteFile(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
