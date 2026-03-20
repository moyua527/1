const db = require('../../../config/db');

module.exports = async ({ project_id, name, original_name, size, mime_type, path, uploaded_by }) => {
  const [result] = await db.query(
    'INSERT INTO duijie_files (project_id, name, original_name, size, mime_type, path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [project_id, name, original_name, size, mime_type, path, uploaded_by]
  );
  return result.insertId;
};
