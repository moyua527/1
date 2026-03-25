const updateOpportunity = require('../../services/opportunity/updateOpportunity');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields).filter(k => fields[k] !== undefined);
    if (!keys.length) return res.json({ success: true });
    await updateOpportunity(id, fields);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
