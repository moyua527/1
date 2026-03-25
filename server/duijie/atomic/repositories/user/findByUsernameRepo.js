const db = require('../../../config/db');

module.exports = async (username) => {
  const [rows] = await db.query(
    'SELECT id FROM voice_users WHERE username = ? AND is_deleted = 0',
    [username]
  );
  return rows;
};
