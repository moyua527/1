const db = require('../../../config/db');
const crypto = require('crypto');
const { normalizeTaskTitlePresets } = require('../../utils/taskTitlePresets');

function generateJoinCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

module.exports = async ({ name, description, client_id, internal_client_id, status, start_date, end_date, budget, tags, app_name, app_url, task_title_presets, created_by }, conn) => {
  const q = conn || db;
  const join_code = generateJoinCode();
  const [result] = await q.query(
    'INSERT INTO duijie_projects (name, description, client_id, internal_client_id, status, start_date, end_date, budget, tags, app_name, app_url, task_title_presets, join_code, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description, client_id, internal_client_id || null, status || 'planning', start_date, end_date, budget || 0, JSON.stringify(tags || []), app_name || null, app_url || null, JSON.stringify(normalizeTaskTitlePresets(task_title_presets)), join_code, created_by]
  );
  return result.insertId;
};
