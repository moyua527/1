const db = require('../../../config/db');

module.exports = async ({ name, description, client_id, internal_client_id, status, start_date, end_date, budget, tags, app_name, app_url, created_by }, conn) => {
  const q = conn || db;
  const [result] = await q.query(
    'INSERT INTO duijie_projects (name, description, client_id, internal_client_id, status, start_date, end_date, budget, tags, app_name, app_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description, client_id, internal_client_id || null, status || 'planning', start_date, end_date, budget || 0, JSON.stringify(tags || []), app_name || null, app_url || null, created_by]
  );
  return result.insertId;
};
