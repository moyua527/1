const db = require('../../../config/db');

module.exports = async ({ project_id, sender_id, content, type, is_client_visible }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_messages (project_id, sender_id, content, type, is_client_visible) VALUES (?, ?, ?, ?, ?)',
    [project_id, sender_id, content, type || 'text', is_client_visible !== undefined ? is_client_visible : 1]
  );
  return result.insertId;
};
