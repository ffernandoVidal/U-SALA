const express = require('express');
const router = express.Router();
const { googleLogin, register, login, me } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');
const { authenticate } = require('../middleware/auth');

router.post('/google', googleLogin);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
