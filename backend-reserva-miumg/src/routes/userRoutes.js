const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/roles');
const { getUsuarios, updateUsuario } = require('../controllers/userController');

router.get('/', authenticate, authorize(ROLES.ADMINISTRADOR), getUsuarios);
router.put('/:id', authenticate, authorize(ROLES.ADMINISTRADOR), updateUsuario);

module.exports = router;
