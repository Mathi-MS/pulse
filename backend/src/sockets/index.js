const socketIo = require('socket.io');

const initSockets = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins a project room to avoid global broadcast leakage
    socket.on('joinProject', (projectId) => {
      if (projectId) {
        const roomName = `project_${projectId}`;
        socket.join(roomName);
        socket.currentProjectId = projectId;
        const count = io.sockets.adapter.rooms.get(roomName)?.size || 0;
        io.to(roomName).emit('liveVisitors', count);
      }
    });

    socket.on('leaveProject', (projectId) => {
      if (projectId) {
        const roomName = `project_${projectId}`;
        socket.leave(roomName);
        const count = io.sockets.adapter.rooms.get(roomName)?.size || 0;
        io.to(roomName).emit('liveVisitors', count);
      }
    });

    socket.on('disconnect', () => {
      if (socket.currentProjectId) {
        const roomName = `project_${socket.currentProjectId}`;
        const count = io.sockets.adapter.rooms.get(roomName)?.size || 0;
        io.to(roomName).emit('liveVisitors', count);
      }
    });
  });

  return io;
};

module.exports = initSockets;
