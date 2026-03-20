const listTags = require('../../services/tag/listTags');

module.exports = async (req, res) => {
  try {
    const data = await listTags();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
