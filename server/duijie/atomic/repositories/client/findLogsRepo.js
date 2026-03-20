const db = require('../../../config/db');

module.exports = async (clientId) => {
  const [rows] = await db.query(
    'SELECT l.*, u.nickname as changed_by_name FROM duijie_client_logs l LEFT JOIN voice_users u ON l.changed_by = u.id WHERE l.client_id = ? ORDER BY l.changed_at DESC LIMIT 50',
    [clientId]
  );
  return rows;
};
