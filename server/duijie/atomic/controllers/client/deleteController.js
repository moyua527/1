const deleteClient = require('../../services/client/deleteClient');

module.exports = async (req, res) => {
  try {
    await deleteClient(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
