const { scoreOne } = require('../../services/client/scoreClient');

module.exports = async (req, res) => {
  try {
    const score = await scoreOne(req.params.id);
    if (!score) return res.status(404).json({ success: false, message: '客户不存在' });
    res.json({ success: true, data: score });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
