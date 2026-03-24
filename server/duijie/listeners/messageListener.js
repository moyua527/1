const eventBus = require('../events');
const { MESSAGE_SENT } = require('../events/eventTypes');
const { getIO } = require('../socket');
const logger = require('../config/logger');

eventBus.on(MESSAGE_SENT, (data) => {
  logger.info(`message sent: project=${data.project_id} sender=${data.sender_id}`);
  const io = getIO();
  if (io) io.to(`project:${data.project_id}`).emit('new_message', data);
});
