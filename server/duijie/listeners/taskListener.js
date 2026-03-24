const eventBus = require('../events');
const { TASK_CREATED, TASK_MOVED } = require('../events/eventTypes');
const { getIO } = require('../socket');
const logger = require('../config/logger');

eventBus.on(TASK_CREATED, (data) => {
  logger.info(`task created: ${data.title} project=${data.project_id}`);
  const io = getIO();
  if (io) io.to(`project:${data.project_id}`).emit('task_created', data);
});

eventBus.on(TASK_MOVED, (data) => {
  logger.info(`task moved: id=${data.id} → ${data.status}`);
  const io = getIO();
  if (io) io.emit('task_moved', data);
});
