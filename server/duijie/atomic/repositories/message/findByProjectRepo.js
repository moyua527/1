const db = require('../../../config/db');

module.exports = async (project_id, { page = 1, limit = 50 } = {}) => {
  const [rows] = await db.query(
    'SELECT m.*, u.nickname as sender_name FROM duijie_messages m LEFT JOIN voice_users u ON m.sender_id = u.id WHERE m.project_id = ? AND m.is_deleted = 0 ORDER BY m.created_at ASC LIMIT ? OFFSET ?',
    [project_id, Number(limit), (Number(page) - 1) * Number(limit)]
  );
  return rows;
};
