const db = require('../../../config/db');

module.exports = async (project_id) => {
  const [rows] = await db.query(
    'SELECT * FROM duijie_milestones WHERE project_id = ? AND is_deleted = 0 ORDER BY due_date ASC',
    [project_id]
  );
  return rows;
};
