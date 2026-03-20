const createClient = require('../../services/client/createClient');

module.exports = async (req, res) => {
  try {
    const id = await createClient({ ...req.body, created_by: req.userId });
    res.json({ success: true, data: { id } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
