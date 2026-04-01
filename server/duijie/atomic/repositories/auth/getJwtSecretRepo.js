const db = require('../../../config/db');

let cached = null;
let cachedAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

module.exports = async () => {
  const now = Date.now();
  if (cached && now - cachedAt < TTL) return cached;
  const [rows] = await db.query(
    "SELECT config_value FROM system_config WHERE config_key = 'JWT_SECRET'"
  );
  cached = rows[0]?.config_value || null;
  cachedAt = now;
  return cached;
};
