const db = require('../../../config/db');

module.exports = async ({ project_id, title, description, due_date, created_by }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_milestones (project_id, title, description, due_date, created_by) VALUES (?, ?, ?, ?, ?)',
    [project_id, title, description, due_date, created_by]
  );
  return result.insertId;
};
