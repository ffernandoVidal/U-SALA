// IMPORTANTE: Asegúrate de que la ruta sea correcta hacia tu archivo db.js
const pool = require('../config/db'); 

const getRecursos = async (req, res) => {
    try {
        // Ejecución de la consulta
        const result = await pool.query('SELECT * FROM recursos WHERE esta_activo = true');
        
        // Retorno de estructura de datos JSON
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error("DETALLE TÉCNICO EN CONTROLADOR:", error.message);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Falla en la capa de persistencia.",
            detail: error.message
        });
    }
};

module.exports = { getRecursos };