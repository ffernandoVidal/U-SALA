const { query } = require('../config/db');

const findAllActivos = async () => {
  const result = await query('SELECT * FROM recursos WHERE esta_activo = true ORDER BY nombre ASC');
  return result.rows;
};

module.exports = { findAllActivos };
