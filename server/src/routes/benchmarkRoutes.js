const express = require('express');
const router = express.Router();
const c = require('../controllers/benchmarkController');
const { simulationLimiter } = require('../middleware/rateLimiter');

router.post('/', simulationLimiter, c.run);
router.get('/:id', c.getById);

module.exports = router;
