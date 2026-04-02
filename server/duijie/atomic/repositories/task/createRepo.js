const db = require('../../../config/db');

module.exports = async ({ project_id, title, description, status, priority, assignee_id, due_date, created_by }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_tasks (project_id, title, description, status, priority, assignee_id, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [project_id, title, description, status || 'submitted', priority || 'medium', assignee_id, due_date, created_by]
  );
  return result.insertId;
};
