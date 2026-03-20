const eventBus = require('../events');
const { PROJECT_CREATED, PROJECT_UPDATED } = require('../events/eventTypes');

eventBus.on(PROJECT_CREATED, (data) => {
  console.log(`[event] 项目创建: ${data.name} (id=${data.id})`);
});

eventBus.on(PROJECT_UPDATED, (data) => {
  console.log(`[event] 项目更新: id=${data.id}`);
});
