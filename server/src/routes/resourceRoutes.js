const express = require('express');
const router = express.Router();
const c = require('../controllers/resourceController');

router.put('/:id', c.update);
router.delete('/:id', c.delete);

module.exports = router;
