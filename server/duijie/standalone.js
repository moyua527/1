const http = require('http');
const app = require('./app');
const logger = require('./config/logger');
const { initSocket } = require('./socket');
require('./listeners/projectListener');
require('./listeners/taskListener');
require('./listeners/messageListener');

const PORT = process.env.PORT || 1800;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`后端服务启动: http://localhost:${PORT}`);
});
