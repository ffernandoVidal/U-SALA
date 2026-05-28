const { query } = require('../config/db');

const findAll = async (filters = {}) => {
  let sql = 'SELECT * FROM recursos WHERE 1=1';
  const params = [];
  let idx = 1;

  if (filters.tipo) {
    sql += ` AND tipo = $${idx++}`;
    params.push(filters.tipo);
  }
  if (filters.estado) {
    sql += ` AND estado = $${idx++}`;
    params.push(filters.estado);
  }
  if (filters.activo !== undefined) {
    sql += ` AND esta_activo = $${idx++}`;
    params.push(filters.activo === 'true' || filters.activo === true);
  }
  if (filters.search) {
    sql += ` AND (nombre ILIKE $${idx} OR codigo ILIKE $${idx})`;
    params.push(`%${filters.search}%`);
    idx++;
  }

  sql += ' ORDER BY nombre ASC';
  const result = await query(sql, params);
  return result.rows;
};

const findAllActivos = async () => {
  const result = await query('SELECT * FROM recursos WHERE esta_activo = true ORDER BY nombre ASC');
  return result.rows;
};

const findById = async (id) => {
  const result = await query('SELECT * FROM recursos WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const findByCode = async (codigo) => {
  const result = await query('SELECT id FROM recursos WHERE codigo = $1', [codigo]);
  return result.rows[0] || null;
};

const create = async ({ nombre, codigo, descripcion, tipo, ubicacion, capacidad, estado }) => {
  const result = await query(
    `INSERT INTO recursos (nombre, codigo, descripcion, tipo, ubicacion, capacidad, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [nombre, codigo, descripcion, tipo, ubicacion, capacidad, estado || 'AVAILABLE']
  );
  return result.rows[0];
};

const update = async (id, { nombre, codigo, descripcion, tipo, ubicacion, capacidad, estado }) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
  if (codigo !== undefined) { fields.push(`codigo = $${idx++}`); values.push(codigo); }
  if (descripcion !== undefined) { fields.push(`descripcion = $${idx++}`); values.push(descripcion); }
  if (tipo !== undefined) { fields.push(`tipo = $${idx++}`); values.push(tipo); }
  if (ubicacion !== undefined) { fields.push(`ubicacion = $${idx++}`); values.push(ubicacion); }
  if (capacidad !== undefined) { fields.push(`capacidad = $${idx++}`); values.push(capacidad); }
  if (estado !== undefined) { fields.push(`estado = $${idx++}`); values.push(estado); }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE recursos SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const toggleActive = async (id) => {
  const result = await query(
    `UPDATE recursos SET esta_activo = NOT esta_activo, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

const updateStatus = async (id, estado) => {
  const result = await query(
    `UPDATE recursos SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [estado, id]
  );
  return result.rows[0] || null;
};

module.exports = { findAll, findAllActivos, findById, findByCode, create, update, toggleActive, updateStatus };
