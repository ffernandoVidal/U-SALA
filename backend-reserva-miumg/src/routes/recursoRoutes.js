const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/roles');
const {
  getRecursos, getRecursosActivos, getRecurso,
  createRecurso, updateRecurso, toggleActivo, cambiarEstado
} = require('../controllers/recursoController');

router.get('/activos', getRecursosActivos);
router.get('/', authenticate, getRecursos);
router.get('/:id', authenticate, authorize(ROLES.ADMINISTRADOR), getRecurso);
router.post('/', authenticate, authorize(ROLES.ADMINISTRADOR), createRecurso);
router.put('/:id', authenticate, authorize(ROLES.ADMINISTRADOR), updateRecurso);
router.patch('/:id/status', authenticate, authorize(ROLES.ADMINISTRADOR), cambiarEstado);
router.patch('/:id/active', authenticate, authorize(ROLES.ADMINISTRADOR), toggleActivo);

module.exports = router;
