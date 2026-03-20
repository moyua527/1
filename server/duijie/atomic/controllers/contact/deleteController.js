const deleteContact = require('../../services/contact/deleteContact');

module.exports = async (req, res) => {
  try {
    await deleteContact(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
