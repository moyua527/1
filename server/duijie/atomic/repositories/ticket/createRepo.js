const db = require('../../../config/db');

module.exports = async ({ title, content, type, priority, project_id, created_by }) => {
  const [r] = await db.query(
    'INSERT INTO duijie_tickets (title, content, type, priority, project_id, created_by) VALUES (?,?,?,?,?,?)',
    [title, content || '', type || 'question', priority || 'medium', project_id || null, created_by]
  );
  return r.insertId;
};
