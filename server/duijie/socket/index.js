const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    logger.debug(`socket connected: ${socket.id}`);

    socket.on('auth', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'duijie_jwt_secret_2024');
        const uid = decoded.userId || decoded.id;
        socket.userId = uid;
        socket.join(`user:${uid}`);
        logger.debug(`socket auth ok: ${socket.id} user:${uid}`);
      } catch (e) {
        logger.warn(`socket auth failed: ${socket.id}`);
      }
    });

    socket.on('join_project', (projectId) => {
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
      logger.debug(`socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
