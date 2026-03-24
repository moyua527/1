const getFollowUpSuggestion = require('../../services/ai/followUpSuggestion');

module.exports = async (req, res) => {
  try {
    const suggestion = await getFollowUpSuggestion(req.params.clientId);
    res.json({ success: true, data: suggestion });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
