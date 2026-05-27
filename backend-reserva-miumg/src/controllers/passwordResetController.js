const { generateAndSendToken, resetPassword } = require('../services/passwordResetService');

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo es requerido' });
  }

  const frontendUrl = process.env.FRONTEND_URL
    || (process.env.ALLOWED_ORIGINS?.split(',')[0])
    || 'http://localhost:3173';

  try {
    await generateAndSendToken(email, frontendUrl);
    res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
  } catch (error) {
    next(error);
  }
};

const resetPasswordHandler = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'La nueva contraseña es requerida' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 8 caracteres, incluir mayúscula, número y símbolo (@$!%*?&)'
    });
  }

  try {
    await resetPassword(token, password);
    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
};

module.exports = { forgotPassword, resetPassword: resetPasswordHandler };
