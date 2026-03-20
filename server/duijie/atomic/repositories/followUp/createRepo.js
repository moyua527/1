const db = require('../../../config/db');

module.exports = async ({ client_id, content, follow_type, next_follow_date, created_by }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_follow_ups (client_id, content, follow_type, next_follow_date, created_by) VALUES (?, ?, ?, ?, ?)',
    [client_id, content, follow_type || 'phone', next_follow_date || null, created_by]
  );
  return result.insertId;
};
