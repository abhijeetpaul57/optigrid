const express = require('express');
const router = express.Router();
const c = require('../controllers/scenarioController');

router.post('/', c.create);
router.get('/', c.list);
router.get('/:id', c.getById);
router.put('/:id', c.update);
router.delete('/:id', c.delete);
router.post('/:id/resources', c.createResource);
router.get('/:id/resources', c.listResources);
router.get('/:id/metrics', c.getMetrics);
router.get('/:id/export', c.exportData);

module.exports = router;
