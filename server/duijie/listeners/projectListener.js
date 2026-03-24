const eventBus = require('../events');
const { PROJECT_CREATED, PROJECT_UPDATED } = require('../events/eventTypes');
const logger = require('../config/logger');

eventBus.on(PROJECT_CREATED, (data) => {
  logger.info(`project created: ${data.name} id=${data.id}`);
});

eventBus.on(PROJECT_UPDATED, (data) => {
  logger.info(`project updated: id=${data.id}`);
});
