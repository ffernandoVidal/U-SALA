const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/roles');
const {
  getTodasLasReservas,
  getMisReservas,
  getReserva,
  crearReserva,
  updateReserva,
  aprobarReserva,
  rechazarReserva,
  cancelarReserva,
  eliminarReserva,
  checkAvailability,
  getAllReservasPublic,
} = require('../controllers/reservaController');

router.get('/availability', authenticate, checkAvailability);
router.get('/all', authenticate, getAllReservasPublic);

router.get('/', authenticate, authorize(ROLES.ADMINISTRADOR), getTodasLasReservas);
router.post('/', authenticate, crearReserva);
router.get('/:id', authenticate, getReserva);
router.put('/:id', authenticate, updateReserva);

router.patch('/:id/approve', authenticate, authorize(ROLES.ADMINISTRADOR), aprobarReserva);
router.patch('/:id/reject', authenticate, authorize(ROLES.ADMINISTRADOR), rechazarReserva);
router.patch('/:id/cancel', authenticate, cancelarReserva);

router.get('/usuario/:usuario_id', authenticate, getMisReservas);
router.delete('/:id', authenticate, eliminarReserva);

module.exports = router;
