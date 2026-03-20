const { scoreAll } = require('../../services/client/scoreClient');

module.exports = async (req, res) => {
  try {
    const data = await scoreAll();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
