const listContacts = require('../../services/contact/listContacts');

module.exports = async (req, res) => {
  try {
    const data = await listContacts(req.params.clientId);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
