const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { httpLogger } = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const scenarioRoutes = require('./routes/scenarioRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const requestRoutes = require('./routes/requestRoutes');
const benchmarkRoutes = require('./routes/benchmarkRoutes');

// App factory function to receive socket.io instance
module.exports = (io) => {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json());
  app.use(httpLogger);
  app.use(apiLimiter);

  // Health check
  app.get('/api/health', (req, res) => res.json({ status: 'ok', engineReady: require('./services/engineService').ready }));

  // Routes
  app.use('/api/scenarios', scenarioRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/benchmarks', benchmarkRoutes);
  
  // Simulation routes need io
  app.use('/api/simulations', require('./routes/simulationRoutes')(io));

  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
  });

  // Error handler
  app.use(errorHandler);

  return app;
};
