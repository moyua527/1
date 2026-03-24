const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`[socket] 客户端连接: ${socket.id}`);

    socket.on('auth', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'duijie_jwt_secret_2024');
        const uid = decoded.userId || decoded.id;
        socket.userId = uid;
        socket.join(`user:${uid}`);
        console.log(`[socket] ${socket.id} 认证成功, 加入 user:${uid}`);
      } catch (e) {
        console.log(`[socket] ${socket.id} 认证失败`);
      }
    });

    socket.on('join_project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`[socket] ${socket.id} 加入房间 project:${projectId}`);
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('heartbeat', (startTime) => {
      socket.emit('heartbeat_ack', startTime);
    });

    socket.on('disconnect', () => {
      console.log(`[socket] 客户端断开: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
