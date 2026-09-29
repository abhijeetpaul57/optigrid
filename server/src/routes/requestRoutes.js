const express = require('express');
const router = express.Router();
const c = require('../controllers/requestController');

// Nested under scenarios: POST /api/scenarios/:id/requests is in scenarioRoutes
// Standalone:
router.get('/:id', c.getById);

module.exports = router;
