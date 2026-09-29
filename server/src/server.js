require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { logger } = require('./utils/logger');
const engineService = require('./services/engineService');
const simulationSocket = require('./sockets/simulationSocket');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  logger.error('MONGODB_URI is not set in environment variables');
  process.exit(1);
}

const io = new Server({
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const app = require('./app')(io);
const server = http.createServer(app);
io.attach(server);

// Setup Socket.IO
simulationSocket(io);

// Start Engine
engineService.start();

mongoose.connect(MONGODB_URI)
.then(() => {
  logger.info('Connected to MongoDB');
  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...');
  engineService.stop();
  mongoose.connection.close();
  server.close(() => {
    process.exit(0);
  });
});
