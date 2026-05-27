const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { sendResetEmail } = require('../config/email');

const generateAndSendToken = async (email, frontendUrl) => {
  const result = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return { sent: true };

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await query(
    `INSERT INTO reset_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, token, expiresAt]
  );

  await sendResetEmail(user.email, token, frontendUrl);
  return { sent: true };
};

const validateToken = async (token) => {
  const result = await query(
    'SELECT * FROM reset_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
    [token]
  );
  return result.rows[0] || null;
};

const resetPassword = async (token, newPassword) => {
  const resetToken = await validateToken(token);
  if (!resetToken) {
    const err = new Error('Token inválido o expirado');
    err.status = 400;
    throw err;
  }

  const password_hash = await bcrypt.hash(newPassword, 10);

  await query(
    'UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [password_hash, resetToken.usuario_id]
  );

  await query('UPDATE reset_tokens SET used = true WHERE id = $1', [resetToken.id]);
};

module.exports = { generateAndSendToken, validateToken, resetPassword };
