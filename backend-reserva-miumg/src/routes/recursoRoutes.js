const express = require('express');
const router = express.Router();
const { 
    crearReserva, 
    getMisReservas, 
    eliminarReserva,
    getTodasLasReservas // Necesaria para el Calendario
} = require('../controllers/reservaController');

router.get('/', getTodasLasReservas);
router.post('/', crearReserva);
router.get('/usuario/:usuario_id', getMisReservas);
router.delete('/:id', eliminarReserva);

module.exports = router;    