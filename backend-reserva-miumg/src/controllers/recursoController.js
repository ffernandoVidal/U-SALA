const recursoService = require('../services/recursoService');

const getRecursos = async (req, res, next) => {
  try {
    const recursos = await recursoService.findAll(req.query);
    res.json(recursos);
  } catch (error) {
    next(error);
  }
};

const getRecursosActivos = async (req, res, next) => {
  try {
    const recursos = await recursoService.findAllActivos();
    res.json(recursos);
  } catch (error) {
    next(error);
  }
};

const getRecurso = async (req, res, next) => {
  try {
    const recurso = await recursoService.findById(req.params.id);
    if (!recurso) return res.status(404).json({ error: 'Recurso no encontrado' });
    res.json(recurso);
  } catch (error) {
    next(error);
  }
};

const createRecurso = async (req, res, next) => {
  try {
    const { nombre, codigo, descripcion, tipo, ubicacion, capacidad, estado } = req.body;

    if (!nombre || !codigo || !tipo) {
      return res.status(400).json({ error: 'Nombre, código y tipo son requeridos' });
    }

    const TIPOS_VALIDOS = ['SALON', 'LABORATORIO', 'SALA_REUNIONES'];
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: `Tipo inválido. Debe ser: ${TIPOS_VALIDOS.join(', ')}` });
    }

    const ESTADOS_VALIDOS = ['AVAILABLE', 'RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Debe ser: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    if (capacidad !== undefined && capacidad !== null && (isNaN(capacidad) || Number(capacidad) <= 0)) {
      return res.status(400).json({ error: 'La capacidad debe ser un número mayor a 0' });
    }

    const existing = await recursoService.findByCode(codigo);
    if (existing) {
      return res.status(409).json({ error: 'Ya existe un recurso con ese código' });
    }

    const recurso = await recursoService.create({
      nombre, codigo, descripcion, tipo, ubicacion,
      capacidad: capacidad !== undefined && capacidad !== null ? Number(capacidad) : null,
      estado: estado || 'AVAILABLE'
    });

    res.status(201).json(recurso);
  } catch (error) {
    next(error);
  }
};

const updateRecurso = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await recursoService.findById(id);
    if (!existing) return res.status(404).json({ error: 'Recurso no encontrado' });

    const { nombre, codigo, descripcion, tipo, ubicacion, capacidad, estado } = req.body;

    if (tipo) {
      const TIPOS_VALIDOS = ['SALON', 'LABORATORIO', 'SALA_REUNIONES'];
      if (!TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ error: `Tipo inválido. Debe ser: ${TIPOS_VALIDOS.join(', ')}` });
      }
    }

    if (estado) {
      const ESTADOS_VALIDOS = ['AVAILABLE', 'RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE'];
      if (!ESTADOS_VALIDOS.includes(estado)) {
        return res.status(400).json({ error: `Estado inválido. Debe ser: ${ESTADOS_VALIDOS.join(', ')}` });
      }
    }

    if (capacidad !== undefined && capacidad !== null && (isNaN(capacidad) || Number(capacidad) <= 0)) {
      return res.status(400).json({ error: 'La capacidad debe ser un número mayor a 0' });
    }

    if (codigo && codigo !== existing.codigo) {
      const dup = await recursoService.findByCode(codigo);
      if (dup) return res.status(409).json({ error: 'Ya existe otro recurso con ese código' });
    }

    const updated = await recursoService.update(id, {
      nombre, codigo, descripcion, tipo, ubicacion,
      capacidad: capacidad !== undefined && capacidad !== null ? Number(capacidad) : undefined,
      estado
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const toggleActivo = async (req, res, next) => {
  try {
    const existing = await recursoService.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Recurso no encontrado' });

    const updated = await recursoService.toggleActive(req.params.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const cambiarEstado = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const ESTADOS_VALIDOS = ['AVAILABLE', 'RESERVED', 'MAINTENANCE', 'OUT_OF_SERVICE'];

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Debe ser: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    const existing = await recursoService.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Recurso no encontrado' });

    const updated = await recursoService.updateStatus(req.params.id, estado);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecursos, getRecursosActivos, getRecurso, createRecurso, updateRecurso, toggleActivo, cambiarEstado };
