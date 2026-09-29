const express = require('express');
const router = express.Router();
const c = require('../controllers/simulationController');
const { simulationLimiter } = require('../middleware/rateLimiter');

// Attach io to req for socket events
const attachIo = (io) => (req, res, next) => { req.io = io; next(); };

module.exports = (io) => {
  router.post('/', simulationLimiter, attachIo(io), c.start);
  router.get('/:id', c.getById);
  router.post('/:id/pause', c.pause);
  router.post('/:id/resume', c.resume);
  router.post('/:id/stop', c.stop);
  router.get('/:id/allocations', c.getAllocations);
  return router;
};
