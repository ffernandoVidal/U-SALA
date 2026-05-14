const { query } = require('../config/db');

/**
 * Busca un usuario por email o lo crea si no existe (Upsert)
 * Complejidad: O(log n) gracias al índice UNIQUE en email
 */
const findOrCreateUser = async (userData) => {
  const { email, nombre_completo, google_id, role_name = 'estudiante' } = userData;

  try {
    // 1. Obtener el ID del rol
    const roleRes = await query('SELECT id FROM roles WHERE nombre = $1', [role_name]);
    const roleId = roleRes.rows[0].id;

    // 2. Intento de búsqueda/inserción
    const userRes = await query(
      `INSERT INTO usuarios (email, nombre_completo, google_id, role_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE 
       SET nombre_completo = EXCLUDED.nombre_completo, google_id = EXCLUDED.google_id
       RETURNING *`,
      [email, nombre_completo, google_id, roleId]
    );

    return userRes.rows[0];
  } catch (error) {
    console.error('Error en userService:', error);
    throw error;
  }
};

module.exports = { findOrCreateUser };