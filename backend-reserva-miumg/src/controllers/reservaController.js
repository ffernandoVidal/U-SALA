const reservaService = require('../services/reservaService');

const getTodasLasReservas = async (req, res, next) => {
  try {
    const reservas = await reservaService.findAll();
    res.json(reservas);
  } catch (error) {
    next(error);
  }
};

const getMisReservas = async (req, res, next) => {
  const { usuario_id } = req.params;
  try {
    const reservas = await reservaService.findByUsuario(usuario_id);
    res.json(reservas);
  } catch (error) {
    next(error);
  }
};

const crearReserva = async (req, res, next) => {
  const { usuario_id, recurso_id, inicio, fin, notes } = req.body;
  try {
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
