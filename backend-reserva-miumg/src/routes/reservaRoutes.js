const express = require('express');
const router = express.Router();
const { crearReserva, getMisReservas } = require('../controllers/reservaController');

router.post('/', crearReserva);
router.get('/usuario/:usuario_id', getMisReservas);

module.exports = router;