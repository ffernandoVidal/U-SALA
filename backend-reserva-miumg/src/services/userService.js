const { query } = require('../config/db');

const findOrCreateUser = async (userData) => {
  const { email, nombre_completo, google_id, role_id = 3 } = userData;

  const existing = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    if (google_id && !user.google_id) {
      const updated = await query(
        `UPDATE usuarios SET google_id = $1, nombre_completo = $2, updated_at = NOW() WHERE email = $3 RETURNING *`,
        [google_id, nombre_completo, email]
      );
      return updated.rows[0];
    }
    return user;
  }

  const result = await query(
    `INSERT INTO usuarios (email, nombre_completo, google_id, role_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [email, nombre_completo, google_id, role_id]
  );
  return result.rows[0];
};

const createUser = async ({ email, nombre_completo, password_hash, role_id = 3 }) => {
  const result = await query(
    `INSERT INTO usuarios (email, nombre_completo, password_hash, role_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [email, nombre_completo, password_hash, role_id]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const findUserByGoogleId = async (google_id) => {
  const result = await query('SELECT * FROM usuarios WHERE google_id = $1', [google_id]);
  return result.rows[0] || null;
};

const findUserById = async (id) => {
  const result = await query(
    `SELECT u.*, r.nombre as role_nombre FROM usuarios u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = { findOrCreateUser, createUser, findUserByEmail, findUserByGoogleId, findUserById };
