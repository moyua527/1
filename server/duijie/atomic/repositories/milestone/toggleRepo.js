const db = require('../../../config/db');

module.exports = async (id) => {
  await db.query(
    `UPDATE duijie_milestones
     SET is_completed = NOT is_completed,
         completed_at = IF(is_completed = 0, NOW(), NULL),
         progress = IF(is_completed = 0, 100, progress)
     WHERE id = ? AND is_deleted = 0`,
    [id]
  );
};
