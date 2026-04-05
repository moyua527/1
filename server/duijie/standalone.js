process.env.TZ = 'Asia/Shanghai';
const http = require('http');
const app = require('./app');
const logger = require('./config/logger');
const { initSocket, getIO } = require('./socket');
const db = require('./config/db');
require('./listeners/projectListener');
require('./listeners/taskListener');
require('./listeners/messageListener');
const milestoneReminder = require('./jobs/milestoneReminder');

const PORT = process.env.PORT || 1800;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`后端服务启动: http://localhost:${PORT}`);
  milestoneReminder.start();
});

// 优雅关闭：关闭连接池和 Socket.IO
function gracefulShutdown(signal) {
  logger.info(`收到 ${signal}，开始优雅关闭...`);
  server.close(async () => {
    const io = getIO();
    if (io) io.close();
    try { await db.end(); } catch (_) {}
    logger.info('服务已安全关闭');
    process.exit(0);
  });
  // 10秒强制退出
  setTimeout(() => { process.exit(1); }, 10000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常安全网
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});
