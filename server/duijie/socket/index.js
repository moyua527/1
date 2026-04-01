const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const getJwtSecret = require('../atomic/repositories/auth/getJwtSecretRepo');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    logger.debug(`socket connected: ${socket.id}`);

    socket.on('auth', async (token) => {
      try {
        const secret = await getJwtSecret();
        if (!secret) { logger.warn('JWT_SECRET not configured'); return; }
        const decoded = jwt.verify(token, secret);
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
