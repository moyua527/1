const deleteClient = require('../../services/client/deleteClient');
const { broadcast } = require('../../utils/broadcast');

module.exports = async (req, res) => {
  try {
    await deleteClient(req.params.id);
    broadcast('client', 'deleted', { id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
