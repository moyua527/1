const createRepo = require('../../repositories/project/createRepo');
const db = require('../../../config/db');
const eventBus = require('../../../events');
const { PROJECT_CREATED } = require('../../../events/eventTypes');

module.exports = async (data) => {
  const id = await createRepo(data);
  if (data.created_by) {
    await db.query(
      'INSERT IGNORE INTO duijie_project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [id, data.created_by, 'owner']
    );
  }
  if (Array.isArray(data.member_ids) && data.member_ids.length > 0) {
    const ids = data.member_ids.filter(uid => uid !== data.created_by);
    if (ids.length > 0) {
      const values = ids.map(uid => [id, uid, 'editor']);
      await db.query(
        'INSERT IGNORE INTO duijie_project_members (project_id, user_id, role) VALUES ?',
        [values]
      );
    }
  }
  eventBus.emit(PROJECT_CREATED, { id, ...data });
  return id;
};
