const db = require('../../../config/db');

module.exports = async (clientId) => {
  const [rows] = await db.query(
    'SELECT f.*, u.nickname as created_by_name FROM duijie_follow_ups f LEFT JOIN voice_users u ON f.created_by = u.id WHERE f.client_id = ? ORDER BY f.created_at DESC LIMIT 100',
    [clientId]
  );
  return rows;
};
