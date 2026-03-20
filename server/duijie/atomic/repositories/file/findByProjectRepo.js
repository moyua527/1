const db = require('../../../config/db');

module.exports = async (project_id) => {
  const [rows] = await db.query(
    'SELECT * FROM duijie_files WHERE project_id = ? AND is_deleted = 0 ORDER BY created_at DESC',
    [project_id]
  );
  return rows;
};
