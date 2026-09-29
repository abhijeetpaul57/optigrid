const { logger } = require('../utils/logger');

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    // Join a simulation room
    socket.on('join_simulation', (simulationId) => {
      const room = `simulation:${simulationId}`;
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room ${room}`);
    });

    // Leave a simulation room
    socket.on('leave_simulation', (simulationId) => {
      const room = `simulation:${simulationId}`;
      socket.leave(room);
      logger.debug(`Socket ${socket.id} left room ${room}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });
};
