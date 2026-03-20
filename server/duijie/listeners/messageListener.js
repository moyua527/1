const eventBus = require('../events');
const { MESSAGE_SENT } = require('../events/eventTypes');
const { getIO } = require('../socket');

eventBus.on(MESSAGE_SENT, (data) => {
  console.log(`[event] 消息发送: project=${data.project_id} sender=${data.sender_id}`);
  const io = getIO();
  if (io) io.to(`project:${data.project_id}`).emit('new_message', data);
});
