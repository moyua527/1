const deleteTag = require('../../services/tag/deleteTag');

module.exports = async (req, res) => {
  try {
    await deleteTag(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
