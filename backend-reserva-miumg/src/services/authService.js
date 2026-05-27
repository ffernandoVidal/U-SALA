const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // Cambiar de 8h a 1h para mejor seguridad
  );
};

const sanitizeUser = (user) => {
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

module.exports = { generateToken, sanitizeUser };
