const updateStatusRepo = require('../../repositories/task/updateStatusRepo');
const eventBus = require('../../../events');
const { TASK_MOVED } = require('../../../events/eventTypes');

module.exports = async (id, status, sort_order) => {
  await updateStatusRepo(id, status, sort_order);
  eventBus.emit(TASK_MOVED, { id, status, sort_order });
};
