const db = require('../../../config/db');

module.exports = async (id, status, sort_order) => {
  await db.query('UPDATE duijie_tasks SET status = ?, sort_order = ? WHERE id = ? AND is_deleted = 0', [status, sort_order || 0, id]);
};
