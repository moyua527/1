const getFollowUpSuggestion = require('../../services/ai/followUpSuggestion');
const logger = require('../../../config/logger');

module.exports = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({ success: false, message: '无效的客户ID' });
    }
    const suggestion = await getFollowUpSuggestion(clientId);
    res.json({ success: true, data: suggestion });
  } catch (e) {
    logger.error('AI suggestion error:', e.message);
    const msg = e.message === '客户不存在' ? '客户不存在' : '获取建议失败，请稍后重试';
    const status = e.message === '客户不存在' ? 404 : 500;
    res.status(status).json({ success: false, message: msg });
  }
};
