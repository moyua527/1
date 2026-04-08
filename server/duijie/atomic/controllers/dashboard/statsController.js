const getStats = require('../../services/dashboard/getStats');
const { cacheGet, cacheSet } = require('../../../config/redis');

module.exports = async (req, res) => {
  try {
    const cacheKey = `dashboard:stats:${req.userId}:${req.activeEnterpriseId || 'all'}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const data = await getStats({ role: req.userRole, userId: req.userId, clientId: req.clientId, activeEnterpriseId: req.activeEnterpriseId });
    await cacheSet(cacheKey, data, 30);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
