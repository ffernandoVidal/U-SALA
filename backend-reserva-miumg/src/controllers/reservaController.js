const reservaService = require('../services/reservaService');
const validator = require('../services/reservationValidator');
const { ROLES } = require('../config/roles');

const getTodasLasReservas = async (req, res, next) => {
  try {
    if (req.user.role_id !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({ error: 'No tienes permiso para ver todas las reservas' });
    }
    const reservas = await reservaService.findAll(req.query);
    res.json(reservas);
  } catch (error) {
    next(error);
  }
};

const getMisReservas = async (req, res, next) => {
  const { usuario_id } = req.params;
  try {
    if (parseInt(usuario_id, 10) !== req.user.id && req.user.role_id !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({ error: 'No puedes ver las reservas de otro usuario' });
    }
    const reservas = await reservaService.findByUsuario(usuario_id);
    res.json(reservas);
  } catch (error) {
    next(error);
  }
};

const getReserva = async (req, res, next) => {
  const { id } = req.params;
  try {
    const reserva = await reservaService.findById(id);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    if (reserva.usuario_id !== req.user.id && req.user.role_id !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta reserva' });
    }
    res.json(reserva);
  } catch (error) {
    next(error);
  }
};

const crearReserva = async (req, res, next) => {
  try {
    const validationErrors = validator.validateCreateReservation(req);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors[0], details: validationErrors });
    }

    const permError = validator.validatePermissionToCreate(req);
    if (permError) {
      return res.status(403).json({ error: permError });
    }

    const { usuario_id, recurso_id, inicio, fin, notes, motivo } = req.body;

    const availability = await validator.validateResourceAvailability(recurso_id);
    if (!availability.disponible) {
      return res.status(409).json({ error: availability.error });
    }

    const conflicts = await validator.checkReservationConflict(recurso_id, inicio, fin);
    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'Conflicto de horario: El recurso ya está reservado en ese intervalo.',
        conflicts: conflicts.map(c => ({
          id: c.id,
          inicio: c.inicio,
          fin: c.fin,
          estado: c.estado,
        })),
      });
    }

    const reserva = await reservaService.create({
      usuario_id,
      recurso_id,
      inicio,
      fin,
      notes,
      motivo,
      created_by: req.user.id,
    });

    const created = await reservaService.findById(reserva.id);
    res.status(201).json(created);
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ error: 'El usuario o recurso especificado no existe' });
    }
    next(error);
  }
};

const updateReserva = async (req, res, next) => {
  const { id } = req.params;
  try {
    const reserva = await reservaService.findById(id);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const permError = validator.validatePermissionToModify(reserva, req.user);
    if (permError) {
      return res.status(403).json({ error: permError });
    }

    if (reserva.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden modificar reservas pendientes' });
    }

    const allowedFields = ['notas', 'motivo'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    updates.updated_by = req.user.id;

    if (req.body.inicio || req.body.fin) {
      const newInicio = req.body.inicio || reserva.inicio;
      const newFin = req.body.fin || reserva.fin;

      const timeErrors = validator.validateTimes(newInicio, newFin);
      if (timeErrors.length > 0) {
        return res.status(400).json({ error: timeErrors[0], details: timeErrors });
      }

      const conflicts = await validator.checkReservationConflict(
        reserva.recurso_id, newInicio, newFin, id
      );
      if (conflicts.length > 0) {
        return res.status(409).json({ error: 'Conflicto de horario con otra reserva' });
      }

      updates.inicio = newInicio;
      updates.fin = newFin;
    }

    const updated = await reservaService.update(id, updates);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const aprobarReserva = async (req, res, next) => {
  const { id } = req.params;
  try {
    const reserva = await reservaService.findById(id);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const transitionError = validator.validateStatusTransition(
      reserva.estado,
      'aprobada',
      req.user
    );
    if (transitionError) {
      return res.status(403).json({ error: transitionError });
    }

    const conflicts = await validator.checkReservationConflict(
      reserva.recurso_id, reserva.inicio, reserva.fin, id
    );
    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'No se puede aprobar: existe un conflicto de horario con otra reserva activa.',
        conflicts: conflicts.map(c => ({ id: c.id, inicio: c.inicio, fin: c.fin, estado: c.estado })),
      });
    }

    const updated = await reservaService.approve(id, req.user.id);
    const result = await reservaService.findById(updated.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const rechazarReserva = async (req, res, next) => {
  const { id } = req.params;
  const { motivo } = req.body;
  try {
    const reserva = await reservaService.findById(id);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const transitionError = validator.validateStatusTransition(
      reserva.estado,
      'rechazada',
      req.user
    );
    if (transitionError) {
      return res.status(403).json({ error: transitionError });
    }

    if (!motivo || motivo.trim().length === 0) {
      return res.status(400).json({ error: 'Debes indicar un motivo de rechazo' });
    }

    const updated = await reservaService.reject(id, req.user.id, motivo.trim());
    const result = await reservaService.findById(updated.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const cancelarReserva = async (req, res, next) => {
  const { id } = req.params;
  const { motivo } = req.body;
  try {
    const reserva = await reservaService.findById(id);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const permError = validator.validatePermissionToModify(reserva, req.user);
    if (permError) {
      return res.status(403).json({ error: permError });
    }

    const transitionError = validator.validateStatusTransition(
      reserva.estado,
      'cancelada',
      req.user
    );
    if (transitionError) {
      return res.status(400).json({ error: transitionError });
    }

    const updated = await reservaService.cancel(id, req.user.id, motivo || 'Cancelado por el usuario');
    const result = await reservaService.findById(updated.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const eliminarReserva = async (req, res, next) => {
  const { id } = req.params;
  try {
    const reserva = await reservaService.findById(id);
    if (!reserva) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reserva.usuario_id !== req.user.id && req.user.role_id !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({ error: 'No puedes eliminar una reserva que no es tuya' });
    }

    const deleted = await reservaService.softRemove(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json({ message: 'Reserva eliminada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

const getAllReservasPublic = async (req, res, next) => {
  try {
    const reservas = await reservaService.findAll({});
    res.json(reservas);
  } catch (error) {
    next(error);
  }
};

const checkAvailability = async (req, res, next) => {
  const { recurso_id, fecha } = req.query;
  try {
    if (!recurso_id || !fecha) {
      return res.status(400).json({ error: 'recurso_id y fecha son requeridos' });
    }

    const slots = await reservaService.checkAvailability(parseInt(recurso_id, 10), fecha);
    const occupied = slots.map(s => ({
      inicio: s.inicio,
      fin: s.fin,
      estado: s.estado,
    }));

    res.json({
      recurso_id: parseInt(recurso_id, 10),
      fecha,
      ocupados: occupied,
      disponible: occupied.length === 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearReserva,
  getMisReservas,
  getTodasLasReservas,
  getReserva,
  updateReserva,
  aprobarReserva,
  rechazarReserva,
  cancelarReserva,
  eliminarReserva,
  checkAvailability,
  getAllReservasPublic,
};
