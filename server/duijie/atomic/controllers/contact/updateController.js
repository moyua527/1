const updateContact = require('../../services/contact/updateContact');

module.exports = async (req, res) => {
  try {
    await updateContact(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
