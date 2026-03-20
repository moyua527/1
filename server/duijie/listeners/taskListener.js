const eventBus = require('../events');
const { TASK_CREATED, TASK_MOVED } = require('../events/eventTypes');
const { getIO } = require('../socket');

eventBus.on(TASK_CREATED, (data) => {
  console.log(`[event] 任务创建: ${data.title} (project=${data.project_id})`);
  const io = getIO();
  if (io) io.to(`project:${data.project_id}`).emit('task_created', data);
});

eventBus.on(TASK_MOVED, (data) => {
  console.log(`[event] 任务移动: id=${data.id} → ${data.status}`);
  const io = getIO();
  if (io) io.emit('task_moved', data);
});
