const db = require('../../../config/db');

module.exports = async (excludeUserId) => {
  const [rows] = await db.query(
    'SELECT id, username, nickname, role FROM voice_users WHERE id != ? AND is_deleted = 0 ORDER BY created_at DESC',
    [excludeUserId]
  );
  return rows;
};
