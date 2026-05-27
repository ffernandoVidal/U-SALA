const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/roles');
const { getRecursos } = require('../controllers/recursoController');

// GET público para ver recursos disponibles
router.get('/', getRecursos);

// POST, PUT, DELETE solo para administradores (cuando existan estos endpoints)
// router.post('/', authenticate, authorize(ROLES.ADMINISTRADOR), createRecurso);
// router.put('/:id', authenticate, authorize(ROLES.ADMINISTRADOR), updateRecurso);
// router.delete('/:id', authenticate, authorize(ROLES.ADMINISTRADOR), deleteRecurso);

module.exports = router;
