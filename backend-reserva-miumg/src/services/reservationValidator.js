const { query } = require('../config/db');
const { ROLES } = require('../config/roles');
const { ESTADOS_RESERVA, ESTADOS_ACTIVOS, ESTADOS_TRANSITABLES } = require('../config/estadosReserva');

const HORARIO_UNIVERSITARIO = { inicio: 7, fin: 22 };
const DURACION_MINIMA_MINUTOS = 30;
const DURACION_MAXIMA_MINUTOS = 480;

const validateTimes = (inicio, fin) => {
  const errors = [];
  const startDate = new Date(inicio);
  const endDate = new Date(fin);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    errors.push('Formato de fecha/hora inválido');
    return errors;
  }

  if (startDate >= endDate) {
    errors.push('La hora de inicio debe ser anterior a la hora de fin');
  }

  const now = new Date();
  if (startDate < now && startDate.toDateString() === now.toDateString()) {
    errors.push('No se pueden crear reservas en el pasado');
  }

  const startHour = startDate.getHours();
  const endHour = endDate.getHours() + endDate.getMinutes() / 60;

  if (startHour < HORARIO_UNIVERSITARIO.inicio || endHour > HORARIO_UNIVERSITARIO.fin) {
    errors.push(`El horario universitario es de ${HORARIO_UNIVERSITARIO.inicio}:00 a ${HORARIO_UNIVERSITARIO.fin}:00`);
  }

  const diffMinutes = (endDate - startDate) / 60000;
  if (diffMinutes < DURACION_MINIMA_MINUTOS) {
    errors.push(`La duración mínima es de ${DURACION_MINIMA_MINUTOS} minutos`);
  }
  if (diffMinutes > DURACION_MAXIMA_MINUTOS) {
    errors.push(`La duración máxima es de ${DURACION_MAXIMA_MINUTOS} minutos (8 horas)`);
  }

  return errors;
};

const checkReservationConflict = async (recursoId, inicio, fin, excludeId = null) => {
  const params = [recursoId, inicio, fin];
  let excludeClause = '';
  if (excludeId) {
    excludeClause = `AND r.id != $${params.length + 1}`;
    params.push(excludeId);
  }

  const arrayIdx = params.length + 1;
  const result = await query(`
    SELECT r.id, r.inicio, r.fin, r.estado
    FROM reservas r
    WHERE r.recurso_id = $1
      AND r.estado = ANY($${arrayIdx}::text[])
      AND r.inicio < $3
      AND r.fin > $2
      ${excludeClause}
    ORDER BY r.inicio ASC
  `, [...params, ESTADOS_ACTIVOS]);

  return result.rows;
};

const validateResourceAvailability = async (recursoId) => {
  const result = await query('SELECT id, nombre, estado, esta_activo FROM recursos WHERE id = $1', [recursoId]);
  const recurso = result.rows[0];

  if (!recurso) {
    return { disponible: false, error: 'El recurso no existe' };
  }

  if (!recurso.esta_activo) {
    return { disponible: false, error: 'El recurso está desactivado' };
  }

  if (recurso.estado === 'MAINTENANCE' || recurso.estado === 'OUT_OF_SERVICE') {
    return { disponible: false, error: `El recurso está ${recurso.estado === 'MAINTENANCE' ? 'en mantenimiento' : 'fuera de servicio'}` };
  }

  return { disponible: true, recurso };
};

const validateCreateReservation = (req) => {
  const errors = [];
  const { usuario_id, recurso_id, inicio, fin, notes } = req.body;

  if (!usuario_id) errors.push('El usuario es requerido');
  if (!recurso_id) errors.push('El recurso es requerido');
  if (!inicio) errors.push('La fecha/hora de inicio es requerida');
  if (!fin) errors.push('La fecha/hora de fin es requerida');

  if (errors.length > 0) return errors;

  if (typeof notes === 'string' && notes.length > 1000) {
    errors.push('Las notas no pueden exceder 1000 caracteres');
  }

  errors.push(...validateTimes(inicio, fin));
  return errors;
};

const validatePermissionToCreate = (req) => {
  const { usuario_id } = req.body;
  const isAdmin = req.user.role_id === ROLES.ADMINISTRADOR;
  const isSelf = parseInt(usuario_id, 10) === req.user.id;

  if (!isSelf && !isAdmin) {
    return 'No puedes crear reservas para otro usuario';
  }
  return null;
};

const validatePermissionToModify = (reserva, user) => {
  if (user.role_id === ROLES.ADMINISTRADOR) return null;
  if (reserva.usuario_id === user.id) return null;
  return 'No tienes permiso para modificar esta reserva';
};

const validateStatusTransition = (currentStatus, targetStatus, user) => {
  const allowed = ESTADOS_TRANSITABLES[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return `No se puede cambiar de "${currentStatus}" a "${targetStatus}"`;
  }

  if (targetStatus === ESTADOS_RESERVA.APROBADA && user.role_id !== ROLES.ADMINISTRADOR) {
    return 'Solo el administrador puede aprobar reservas';
  }

  if (targetStatus === ESTADOS_RESERVA.RECHAZADA && user.role_id !== ROLES.ADMINISTRADOR) {
    return 'Solo el administrador puede rechazar reservas';
  }

  return null;
};

module.exports = {
  validateTimes,
  checkReservationConflict,
  validateResourceAvailability,
  validateCreateReservation,
  validatePermissionToCreate,
  validatePermissionToModify,
  validateStatusTransition,
  HORARIO_UNIVERSITARIO,
  DURACION_MINIMA_MINUTOS,
  DURACION_MAXIMA_MINUTOS,
};
