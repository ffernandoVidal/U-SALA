const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/roles');
const {
  getTodasLasReservas,
  getMisReservas,
  crearReserva,
  eliminarReserva
} = require('../controllers/reservaController');

// TODAS las rutas requieren autenticación
router.get('/', authenticate, authorize(ROLES.ADMINISTRADOR), getTodasLasReservas);
router.post('/', authenticate, crearReserva);
router.get('/usuario/:usuario_id', authenticate, getMisReservas);
router.delete('/:id', authenticate, eliminarReserva);

module.exports = router;
