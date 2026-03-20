const createRepo = require('../../repositories/file/createRepo');
const eventBus = require('../../../events');
const { FILE_UPLOADED } = require('../../../events/eventTypes');

module.exports = async (data) => {
  const id = await createRepo(data);
  eventBus.emit(FILE_UPLOADED, { id, ...data });
  return id;
};
