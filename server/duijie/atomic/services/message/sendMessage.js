const createRepo = require('../../repositories/message/createRepo');
const eventBus = require('../../../events');
const { MESSAGE_SENT } = require('../../../events/eventTypes');

module.exports = async (data) => {
  const id = await createRepo(data);
  eventBus.emit(MESSAGE_SENT, { id, ...data });
  return id;
};
