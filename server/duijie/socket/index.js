const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const getJwtSecret = require('../atomic/repositories/auth/getJwtSecretRepo');

let io = null;
// 连接指标
let connectionCount = 0;
let peakConnections = 0;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: '/socket.io',
    pingInterval: 25000,
    pingTimeout: 20000,
    maxHttpBufferSize: 1e6, // 1MB 最大消息体
  });

  // 连接级速率限制
  const eventCounts = new Map();
  const EVENT_LIMIT = 60; // 每分钟每连接最多60个事件

  io.on('connection', (socket) => {
    connectionCount++;
    if (connectionCount > peakConnections) peakConnections = connectionCount;
    logger.debug(`socket connected: ${socket.id} (total: ${connectionCount})`);

    // 事件速率限制
    const originalOnEvent = socket.onevent;
    socket.onevent = function (packet) {
      const now = Date.now();
      const key = socket.id;
      const record = eventCounts.get(key) || { count: 0, resetAt: now + 60000 };
      if (now > record.resetAt) { record.count = 0; record.resetAt = now + 60000; }
      record.count++;
      eventCounts.set(key, record);
      if (record.count > EVENT_LIMIT) {
        logger.warn(`socket rate limit: ${socket.id} (${record.count} events/min)`);
        return; // 静默丢弃
      }
      originalOnEvent.call(socket, packet);
    };

    socket.on('auth', async (token) => {
      try {
        const secret = await getJwtSecret();
        if (!secret) { logger.warn('JWT_SECRET not configured'); return; }
        const decoded = jwt.verify(token, secret);
        const uid = decoded.userId || decoded.id;
        socket.userId = uid;
        socket.join(`user:${uid}`);
        socket.emit('auth_ok', { userId: uid });
        logger.debug(`socket auth ok: ${socket.id} user:${uid}`);
      } catch (e) {
        socket.emit('auth_error', { message: '认证失败' });
        logger.warn(`socket auth failed: ${socket.id}`);
      }
    });

    socket.on('join_project', (projectId) => {
      if (!socket.userId) return; // 未认证不允许加入房间
      socket.join(`project:${projectId}`);
      logger.debug(`socket join project:${projectId} ${socket.id}`);
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('heartbeat', (startTime) => {
      socket.emit('heartbeat_ack', startTime);
    });

    socket.on('disconnect', () => {
      connectionCount--;
      eventCounts.delete(socket.id);
      logger.debug(`socket disconnected: ${socket.id} (total: ${connectionCount})`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function getStats() {
  return { connections: connectionCount, peak: peakConnections };
}

module.exports = { initSocket, getIO, getStats };
