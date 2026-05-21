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
        socket.join(`project_${projectId}`);
        socket.currentProjectId = projectId;
        const visitorCount = io.sockets.adapter.rooms.get(`visitors_${projectId}`)?.size || 0;
        io.to(`project_${projectId}`).emit('liveVisitors', visitorCount);
      }
    });

    socket.on('joinVisitor', (projectId) => {
      if (projectId) {
        socket.join(`visitors_${projectId}`);
        socket.currentVisitorProjectId = projectId;
        const visitorCount = io.sockets.adapter.rooms.get(`visitors_${projectId}`)?.size || 0;
        io.to(`project_${projectId}`).emit('liveVisitors', visitorCount);
      }
    });

    socket.on('leaveProject', (projectId) => {
      if (projectId) {
        socket.leave(`project_${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      const projectId = socket.currentVisitorProjectId;
      if (projectId) {
        setTimeout(() => {
          const visitorCount = io.sockets.adapter.rooms.get(`visitors_${projectId}`)?.size || 0;
          io.to(`project_${projectId}`).emit('liveVisitors', visitorCount);
        }, 100);
      }
    });
  });

  return io;
};

module.exports = initSockets;
