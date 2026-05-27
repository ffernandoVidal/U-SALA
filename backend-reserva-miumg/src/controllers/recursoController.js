const { findAllActivos } = require('../services/recursoService');

const getRecursos = async (req, res, next) => {
  try {
    const recursos = await findAllActivos();
    res.json(recursos);
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecursos };
