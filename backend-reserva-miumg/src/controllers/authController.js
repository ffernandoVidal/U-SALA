const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const { findOrCreateUser, createUser, findUserByEmail } = require('../services/userService');
const { generateToken, sanitizeUser } = require('../services/authService');
const { ROLES } = require('../config/roles');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res, next) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload.email.endsWith('@miumg.edu.gt')) {
      return res.status(403).json({
        error: 'Acceso denegado. Solo correos @miumg.edu.gt son permitidos.'
      });
    }

    const user = await findOrCreateUser({
      email: payload.email,
      nombre_completo: payload.name,
      google_id: payload.sub,
      picture: payload.picture
    });

    const internalToken = generateToken(user);
    res.json({ token: internalToken, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  const { email, nombre_completo, password, role_id } = req.body;

  if (!email || !nombre_completo || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (!email.endsWith('@miumg.edu.gt')) {
    return res.status(403).json({
      error: 'Acceso denegado. Solo correos @miumg.edu.gt son permitidos.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await createUser({
      email,
      nombre_completo,
      password_hash,
      role_id: role_id || ROLES.USUARIO
    });

    const internalToken = generateToken(user);
    res.status(201).json({ token: internalToken, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        error: 'Esta cuenta usa Google. Inicia sesión con Google.'
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const internalToken = generateToken(user);
    res.json({ token: internalToken, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

module.exports = { googleLogin, register, login, me };
