const jwt = require('jsonwebtoken');
const db = require('../../config/db');

async function getSecret() {
  const [rows] = await db.query(
    "SELECT config_value FROM system_config WHERE config_key = 'JWT_SECRET'"
  );
  return rows[0]?.config_value;
}

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) || req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: '未登录' });
    const secret = await getSecret();
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId || decoded.id;
    req.userRole = decoded.role || 'member';
    req.clientId = decoded.clientId || null;
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: '认证失败' });
  }
};
