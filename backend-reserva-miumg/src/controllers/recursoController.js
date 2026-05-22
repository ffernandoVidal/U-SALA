const pool = require('../config/db');

const getRecursos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM recursos WHERE esta_activo = true ORDER BY nombre ASC');
        return res.status(200).json(result.rows);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = { getRecursos };   