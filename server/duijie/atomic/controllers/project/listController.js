const listProjects = require('../../services/project/listProjects');
const logger = require('../../../config/logger');
const { cacheGet, cacheSet } = require('../../../config/redis');

module.exports = async (req, res) => {
  try {
    const auth = { role: req.userRole, userId: req.userId, clientId: req.clientId, activeEnterpriseId: req.activeEnterpriseId };
    const cacheKey = `projects:list:${req.userId}:${req.activeEnterpriseId || 'all'}:${req.query.status || ''}:${req.query.search || ''}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    logger.debug(`project/list auth=${JSON.stringify(auth)} query=${JSON.stringify(req.query)}`);
    const data = await listProjects(req.query, auth);
    logger.debug(`project/list total=${data.total} rows=${data.rows?.length}`);
    await cacheSet(cacheKey, data, 15);
    res.json({ success: true, data });
  } catch (e) {
    logger.error(`project/list: ${e.message}`);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
};
