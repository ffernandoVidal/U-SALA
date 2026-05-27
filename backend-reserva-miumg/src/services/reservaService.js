const { query } = require('../config/db');

const findAll = async () => {
  const result = await query(`
    SELECT r.*, rec.nombre as recurso_nombre, u.nombre_completo as usuario_nombre
    FROM reservas r
    JOIN recursos rec ON r.recurso_id = rec.id
    JOIN usuarios u ON r.usuario_id = u.id
    ORDER BY r.inicio ASC
  `);
  return result.rows;
};

const findByUsuario = async (usuario_id) => {
  const result = await query(`
    SELECT r.*, rec.nombre as recurso_nombre
    FROM reservas r
    JOIN recursos rec ON r.recurso_id = rec.id
    WHERE r.usuario_id = $1
    ORDER BY r.inicio DESC
  `, [usuario_id]);
  return result.rows;
};

const findById = async (id) => {
  const result = await query(`
    SELECT r.*, rec.nombre as recurso_nombre, u.nombre_completo as usuario_nombre
    FROM reservas r
    JOIN recursos rec ON r.recurso_id = rec.id
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE r.id = $1
  `, [id]);
  return result.rows[0] || null;
};

const create = async ({ usuario_id, recurso_id, inicio, fin, notas }) => {
  const result = await query(`
    INSERT INTO reservas (usuario_id, recurso_id, inicio, fin, notas)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [usuario_id, recurso_id, inicio, fin, notas || null]);
  return result.rows[0];
};

const remove = async (id) => {
  const result = await query('DELETE FROM reservas WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

module.exports = { findAll, findByUsuario, findById, create, remove };
