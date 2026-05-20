const socketIo = require('socket.io');

const initSockets = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins a project room to avoid global broadcast leakage
    socket.on('joinProject', (projectId) => {
      if (projectId) {
        const roomName = `project_${projectId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
      }
    });

    // User leaves a project room
    socket.on('leaveProject', (projectId) => {
      if (projectId) {
        const roomName = `project_${projectId}`;
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room: ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = initSockets;
