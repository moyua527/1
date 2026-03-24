const updateClient = require('../../services/client/updateClient');

module.exports = async (req, res) => {
  try {
    await updateClient(req.params.id, req.body, req.userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
