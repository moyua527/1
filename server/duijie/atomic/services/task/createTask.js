const createRepo = require('../../repositories/task/createRepo');
const eventBus = require('../../../events');
const { TASK_CREATED } = require('../../../events/eventTypes');

module.exports = async (data) => {
  const id = await createRepo(data);
  eventBus.emit(TASK_CREATED, { id, ...data });
  return id;
};
