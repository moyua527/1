const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const logger = require('../../config/logger');
const getJwtSecret = require('../repositories/auth/getJwtSecretRepo');
const cache = require('../utils/memoryCache');

async function getCurrentUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const [rows] = await db.query(
    'SELECT id, role, client_id, is_active, active_enterprise_id FROM voice_users WHERE id = ? AND is_deleted = 0 LIMIT 1',
    [userId]
  );
  const user = rows[0] || null;
  if (user) cache.set(cacheKey, user, 30000); // 30秒缓存
  return user;
}

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) || req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: '未登录' });
    const secret = await getJwtSecret();
    const decoded = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.id;
    const currentUser = userId ? await getCurrentUser(userId) : null;
    if (!currentUser || currentUser.is_active !== 1) {
      return res.status(401).json({ success: false, message: '认证失败' });
    }
    req.userId = currentUser.id;
    req.userRole = currentUser.role || 'member';
    req.clientId = currentUser.client_id || null;
    req.activeEnterpriseId = currentUser.active_enterprise_id ? Number(currentUser.active_enterprise_id) : null;
    req.user = { id: currentUser.id, userId: currentUser.id, role: req.userRole, clientId: req.clientId, activeEnterpriseId: req.activeEnterpriseId };
    logger.debug(`auth uid=${req.userId} role=${req.userRole} ent=${req.activeEnterpriseId} ${req.originalUrl}`);
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: '认证失败' });
  }
};
