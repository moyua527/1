const db = require('../../../config/db');

module.exports = async () => {
  const [rows] = await db.query(
    "SELECT config_value FROM system_config WHERE config_key = 'JWT_SECRET'"
  );
  return rows[0]?.config_value || null;
};
