const db = require('../../../config/db');

module.exports = async ({ name, description, client_id, status, start_date, end_date, budget, tags, created_by }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_projects (name, description, client_id, status, start_date, end_date, budget, tags, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description, client_id, status || 'planning', start_date, end_date, budget || 0, JSON.stringify(tags || []), created_by]
  );
  return result.insertId;
};
