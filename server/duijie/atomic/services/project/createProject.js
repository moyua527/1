const createRepo = require('../../repositories/project/createRepo');
const db = require('../../../config/db');
const eventBus = require('../../../events');
const { PROJECT_CREATED } = require('../../../events/eventTypes');

module.exports = async (data) => {
  const id = await createRepo(data);
  if (data.created_by) {
    await db.query(
      "INSERT IGNORE INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, ?, 'internal')",
      [id, data.created_by, 'owner']
    );
  }
  if (data.client_id) {
    const [[client]] = await db.query('SELECT user_id FROM duijie_clients WHERE id = ? AND is_deleted = 0', [data.client_id]);
    if (client && client.user_id) {
      await db.query(
        "INSERT IGNORE INTO duijie_project_members (project_id, user_id, role, source) VALUES (?, ?, ?, 'client')",
        [id, client.user_id, 'viewer']
      );
    }
  }
  if (Array.isArray(data.member_ids) && data.member_ids.length > 0) {
    const ids = data.member_ids.filter(uid => uid !== data.created_by);
    if (ids.length > 0) {
      const values = ids.map(uid => [id, uid, 'editor', 'internal']);
      await db.query(
        'INSERT IGNORE INTO duijie_project_members (project_id, user_id, role, source) VALUES ?',
        [values]
      );
    }
  }
  eventBus.emit(PROJECT_CREATED, { id, ...data });
  return id;
};
