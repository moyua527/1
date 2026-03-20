const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`[socket] 客户端连接: ${socket.id}`);

    socket.on('join_project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`[socket] ${socket.id} 加入房间 project:${projectId}`);
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
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
