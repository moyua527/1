const toggleRepo = require('../../repositories/milestone/toggleRepo');
const eventBus = require('../../../events');
const { MILESTONE_TOGGLED } = require('../../../events/eventTypes');

module.exports = async (id) => {
  await toggleRepo(id);
  eventBus.emit(MILESTONE_TOGGLED, { id });
};
