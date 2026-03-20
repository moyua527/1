const updateRepo = require('../../repositories/project/updateRepo');
const eventBus = require('../../../events');
const { PROJECT_UPDATED } = require('../../../events/eventTypes');

module.exports = async (id, fields) => {
  await updateRepo(id, fields);
  eventBus.emit(PROJECT_UPDATED, { id, ...fields });
};
