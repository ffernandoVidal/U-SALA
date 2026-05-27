const reservaService = require('../services/reservaService');
const Joi = require('joi');

// Esquemas de validación
const reservaSchema = Joi.object({
  usuario_id: Joi.number().positive().required(),
  recurso_id: Joi.number().positive().required(),
  inicio: Joi.date().required(),
  fin: Joi.date().min(Joi.ref('inicio')).required(),
  notes: Joi.string().max(500)
});

const getTodasLasReservas = async (req, res, next) => {
  try {
    // Solo administradores pueden ver TODAS las reservas
    if (req.user.role_id !== 1) {
      return res.status(403).json({ error: 'No tienes permiso para ver todas las reservas' });
    }
    const reservas = await reservaService.findAll();
    res.json(reservas);
  } catch (error) {
    next(error);
  }
};

const getMisReservas = async (req, res, next) => {
  const { usuario_id } = req.params;
  try {
    // Verificar que el usuario autenticado sea dueño o administrador
    if (parseInt(usuario_id, 10) !== req.user.id && req.user.role_id !== 1) {
      return res.status(403).json({ error: 'No puedes ver las reservas de otro usuario' });
    }
    
    const reservas = await reservaService.findByUsuario(usuario_id);
    res.json(reservas);
  } catch (error) {
    next(error);
  }
};

const crearReserva = async (req, res, next) => {
  const { usuario_id, recurso_id, inicio, fin, notes } = req.body;
  try {
    // Validar entrada
    const { error, value } = reservaSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verificar que el usuario cree reservas para sí mismo (o admin lo hace por otro)
    if (usuario_id !== req.user.id && req.user.role_id !== 1) {
      return res.status(403).json({ error: 'No puedes crear reservas para otro usuario' });
    }

    const reserva = await reservaService.create({
      usuario_id,
      recurso_id,
      inicio,
      fin,
      notas: notes
    });
    res.status(201).json(reserva);
  } catch (error) {
    if (error.code === '23P01') {
      return res.status(409).json({
        error: "Conflicto de horario: El recurso ya está reservado en ese intervalo."
      });
    }
    next(error);
  }
};

const eliminarReserva = async (req, res, next) => {
  const { id } = req.params;
  try {
    // Primero obtener la reserva para verificar propiedad
    const reserva = await reservaService.findById(id);
    if (!reserva) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }

    // Verificar que el dueño la elimina o un administrador
    if (reserva.usuario_id !== req.user.id && req.user.role_id !== 1) {
      return res.status(403).json({ error: "No puedes eliminar una reserva que no es tuya" });
    }

    const deleted = await reservaService.remove(id);
    if (!deleted) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }
    res.json({ message: "Reserva eliminada exitosamente." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearReserva,
  getMisReservas,
  getTodasLasReservas,
  eliminarReserva
};
