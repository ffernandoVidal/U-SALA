const express = require('express');
const router = express.Router();
const { getRecursos } = require('../controllers/recursoController');

router.get('/', getRecursos);

module.exports = router;
