const express = require('express');
const router = express.Router();
const {
  getTodasLasReservas,
  getMisReservas,
  crearReserva,
  eliminarReserva
} = require('../controllers/reservaController');

router.get('/', getTodasLasReservas);
router.post('/', crearReserva);
router.get('/usuario/:usuario_id', getMisReservas);
router.delete('/:id', eliminarReserva);

module.exports = router;
