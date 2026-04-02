const db = require('../../../config/db');

module.exports = async (identifier) => {
  const [rows] = await db.query(
    'SELECT * FROM voice_users WHERE (username = ? OR phone = ? OR display_id = ?) AND is_deleted = 0 LIMIT 1',
    [identifier, identifier, identifier]
  );
  return rows[0] || null;
};
