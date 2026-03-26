const db = require('../../config/db');
const logger = require('../../config/logger');

module.exports = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'];
      if (!apiKey) {
        return res.status(401).json({ success: false, message: '缺少 X-API-Key 请求头' });
      }

      const [rows] = await db.query(
        'SELECT * FROM duijie_partner_api_keys WHERE api_key = ? AND is_active = 1',
        [apiKey]
      );

      if (!rows.length) {
        logger.warn(`partner auth failed: invalid key ${apiKey.substring(0, 8)}...`);
        return res.status(401).json({ success: false, message: '无效的 API Key' });
      }

      const partner = rows[0];
      const permissions = Array.isArray(partner.permissions)
        ? partner.permissions
        : partner.permissions
          ? JSON.parse(partner.permissions)
          : [];

      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.some(p => permissions.includes(p));
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: '该 API Key 无此接口权限' });
        }
      }

      db.query(
        'UPDATE duijie_partner_api_keys SET last_used_at = NOW(), call_count = call_count + 1 WHERE id = ?',
        [partner.id]
      ).catch(() => {});

      req.partnerId = partner.id;
      req.partnerName = partner.partner_name;
      req.partnerPermissions = permissions;
      logger.info(`partner [${partner.partner_name}] ${req.method} ${req.originalUrl}`);
      next();
    } catch (e) {
      logger.error(`partner auth error: ${e.message}`);
      res.status(500).json({ success: false, message: '认证服务异常' });
    }
  };
};
