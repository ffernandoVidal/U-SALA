const express = require('express');
const router = express.Router();
const { getRecursos } = require('../controllers/recursoController');

// CORRECTO: Pasamos la referencia a la función
router.get('/', getRecursos); 

module.exports = router;