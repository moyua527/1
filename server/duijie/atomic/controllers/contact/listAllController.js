const listAllContacts = require('../../services/contact/listAllContacts');

module.exports = async (req, res) => {
  try {
    const data = await listAllContacts();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
