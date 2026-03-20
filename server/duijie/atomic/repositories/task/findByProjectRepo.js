const db = require('../../../config/db');

module.exports = async (project_id, auth = {}) => {
  if (project_id) {
    const [rows] = await db.query(
      'SELECT * FROM duijie_tasks WHERE project_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, created_at DESC',
      [project_id]
    );
    return rows;
  }
  let filter = '';
  const params = [];
  if (auth.role === 'member' && auth.userId) {
    filter = 'AND t.project_id IN (SELECT project_id FROM duijie_project_members WHERE user_id = ? UNION SELECT id FROM duijie_projects WHERE created_by = ? AND is_deleted = 0)';
    params.push(auth.userId, auth.userId);
  }
  const [rows] = await db.query(
    `SELECT t.* FROM duijie_tasks t WHERE t.is_deleted = 0 ${filter} ORDER BY t.sort_order ASC, t.created_at DESC`,
    params
  );
  return rows;
};
