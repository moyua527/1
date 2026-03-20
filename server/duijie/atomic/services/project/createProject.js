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
  eventBus.emit(PROJECT_CREATED, { id, ...data });
  return id;
};
