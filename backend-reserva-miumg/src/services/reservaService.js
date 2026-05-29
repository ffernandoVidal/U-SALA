const { query } = require('../config/db');
const { ESTADOS_RESERVA } = require('../config/estadosReserva');

const SELECT_BASE = `
  SELECT r.*,
    rec.nombre as recurso_nombre,
    rec.ubicacion as recurso_ubicacion,
    rec.tipo as recurso_tipo,
    u.nombre_completo as usuario_nombre,
    u.email as usuario_email,
    ap.nombre_completo as aprobado_por_nombre,
    rej.nombre_completo as rechazado_por_nombre,
    canc.nombre_completo as cancelado_por_nombre
  FROM reservas r
  JOIN recursos rec ON r.recurso_id = rec.id
  JOIN usuarios u ON r.usuario_id = u.id
  LEFT JOIN usuarios ap ON r.aprobado_por = ap.id
  LEFT JOIN usuarios rej ON r.rechazado_por = rej.id
  LEFT JOIN usuarios canc ON r.cancelado_por = canc.id
`;

const findAll = async (filters = {}) => {
  let sql = `${SELECT_BASE} WHERE r.deleted_at IS NULL`;
  const params = [];
  let idx = 1;

  if (filters.estado) {
    sql += ` AND r.estado = $${idx++}`;
    params.push(filters.estado);
  }
  if (filters.recurso_id) {
    sql += ` AND r.recurso_id = $${idx++}`;
    params.push(parseInt(filters.recurso_id, 10));
  }
  if (filters.usuario_id) {
    sql += ` AND r.usuario_id = $${idx++}`;
    params.push(parseInt(filters.usuario_id, 10));
  }
  if (filters.tipo) {
    sql += ` AND rec.tipo = $${idx++}`;
    params.push(filters.tipo);
  }
  if (filters.fecha_desde) {
    sql += ` AND r.inicio >= $${idx++}`;
    params.push(filters.fecha_desde);
  }
  if (filters.fecha_hasta) {
    sql += ` AND r.fin <= $${idx++}`;
    params.push(filters.fecha_hasta);
  }

  sql += ' ORDER BY r.inicio ASC';
  const result = await query(sql, params);
  return result.rows;
};

const findByUsuario = async (usuario_id) => {
  const result = await query(`
    ${SELECT_BASE}
    WHERE r.usuario_id = $1 AND r.deleted_at IS NULL
    ORDER BY r.inicio DESC
  `, [usuario_id]);
  return result.rows;
};

const findById = async (id) => {
  const result = await query(`
    ${SELECT_BASE}
    WHERE r.id = $1 AND r.deleted_at IS NULL
  `, [id]);
  return result.rows[0] || null;
};

const create = async ({ usuario_id, recurso_id, inicio, fin, notes, motivo, created_by }) => {
  const result = await query(`
    INSERT INTO reservas (usuario_id, recurso_id, inicio, fin, notas, motivo, estado, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [
    usuario_id,
    recurso_id,
    inicio,
    fin,
    notes || null,
    motivo || notes || null,
    ESTADOS_RESERVA.PENDIENTE,
    created_by || parseInt(usuario_id, 10),
  ]);
  return result.rows[0];
};

const update = async (id, fields) => {
  const setClauses = [];
  const values = [];
  let idx = 1;

  const allowedFields = ['notas', 'motivo', 'inicio', 'fin'];
  for (const field of allowedFields) {
    if (fields[field] !== undefined) {
      setClauses.push(`${field} = $${idx++}`);
      values.push(fields[field]);
    }
  }

  if (fields.updated_by !== undefined) {
    setClauses.push(`updated_by = $${idx++}`);
    values.push(fields.updated_by);
  }

  if (setClauses.length === 0) return findById(id);

  setClauses.push('updated_at = NOW()');
  values.push(id);

  const result = await query(
    `UPDATE reservas SET ${setClauses.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const approve = async (id, adminId) => {
  const result = await query(`
    UPDATE reservas
    SET estado = $1, aprobado_por = $2, updated_at = NOW(), updated_by = $2
    WHERE id = $3 AND deleted_at IS NULL
    RETURNING *
  `, [ESTADOS_RESERVA.APROBADA, adminId, id]);
  return result.rows[0] || null;
};

const reject = async (id, adminId, motivo) => {
  const result = await query(`
    UPDATE reservas
    SET estado = $1, rechazado_por = $2, rechazo_motivo = $3, updated_at = NOW(), updated_by = $2
    WHERE id = $4 AND deleted_at IS NULL
    RETURNING *
  `, [ESTADOS_RESERVA.RECHAZADA, adminId, motivo, id]);
  return result.rows[0] || null;
};

const cancel = async (id, userId, motivo) => {
  const result = await query(`
    UPDATE reservas
    SET estado = $1, cancelado_por = $2, cancelacion_motivo = $3, updated_at = NOW(), updated_by = $2
    WHERE id = $4 AND deleted_at IS NULL
    RETURNING *
  `, [ESTADOS_RESERVA.CANCELADA, userId, motivo, id]);
  return result.rows[0] || null;
};

const finalize = async (id) => {
  const result = await query(`
    UPDATE reservas
    SET estado = $1, updated_at = NOW()
    WHERE id = $2 AND deleted_at IS NULL AND estado = $3
    RETURNING *
  `, [ESTADOS_RESERVA.FINALIZADA, id, ESTADOS_RESERVA.APROBADA]);
  return result.rows[0] || null;
};

const softRemove = async (id) => {
  const result = await query(`
    UPDATE reservas SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *
  `, [id]);
  return result.rows[0] || null;
};

const remove = async (id) => {
  const result = await query('DELETE FROM reservas WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
};

const checkAvailability = async (recursoId, fecha) => {
  const result = await query(`
    SELECT r.inicio, r.fin, r.estado
    FROM reservas r
    WHERE r.recurso_id = $1
      AND r.inicio::date = $2::date
      AND r.estado IN ('pendiente', 'aprobada')
      AND r.deleted_at IS NULL
    ORDER BY r.inicio ASC
  `, [recursoId, fecha]);
  return result.rows;
};

const findConflicts = async (recursoId, inicio, fin, excludeId = null) => {
  const params = [recursoId, inicio, fin];
  let excludeClause = '';
  if (excludeId) {
    excludeClause = 'AND r.id != $4';
    params.push(excludeId);
  }

  const result = await query(`
    SELECT r.id, r.inicio, r.fin, r.estado
    FROM reservas r
    WHERE r.recurso_id = $1
      AND r.estado IN ('pendiente', 'aprobada')
      AND r.deleted_at IS NULL
      AND r.inicio < $3
      AND r.fin > $2
      ${excludeClause}
    ORDER BY r.inicio ASC
  `, params);
  return result.rows;
};

module.exports = {
  findAll,
  findByUsuario,
  findById,
  create,
  update,
  approve,
  reject,
  cancel,
  finalize,
  softRemove,
  remove,
  checkAvailability,
  findConflicts,
};
