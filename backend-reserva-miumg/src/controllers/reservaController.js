// Asumimos que tienes configurado tu pool de conexiones a PostgreSQL en config/db
const pool = require('../config/db'); 

// 1. O(1) - Obtener todas las reservas (Para alimentar el calendario general)
const getTodasLasReservas = async (req, res) => {
    try {
        const query = `
            SELECT r.*, rec.nombre as recurso_nombre, u.nombre_completo as usuario_nombre
            FROM reservas r
            JOIN recursos rec ON r.recurso_id = rec.id
            JOIN usuarios u ON r.usuario_id = u.id
            ORDER BY r.inicio ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. O(1) - Obtener las reservas de un usuario específico (Filtro por UI)
const getMisReservas = async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const query = `
            SELECT r.*, rec.nombre as recurso_nombre 
            FROM reservas r
            JOIN recursos rec ON r.recurso_id = rec.id
            WHERE r.usuario_id = $1
            ORDER BY r.inicio DESC;
        `;
        const result = await pool.query(query, [usuario_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. O(1) - Crear una nueva reserva (El motor maneja la exclusión temporal con GiST)
const crearReserva = async (req, res) => {
    const { usuario_id, recurso_id, inicio, fin, notes } = req.body;
    try {
        const query = `
            INSERT INTO reservas (usuario_id, recurso_id, inicio, fin, notas)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [usuario_id, recurso_id, inicio, fin, notes || null];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        // Captura explícita de colisión de exclusión de PostgreSQL (Código 23P01)
        if (error.code === '23P01') {
            return res.status(409).json({ error: "Conflicto de horario: El recurso ya está reservado en ese intervalo." });
        }
        res.status(500).json({ error: error.message });
    }
};

// 4. O(1) - Eliminar una reserva
const eliminarReserva = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `DELETE FROM reservas WHERE id = $1 RETURNING *;`;
        const result = await pool.query(query, [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Reserva no encontrada." });
        }
        res.json({ message: "Reserva eliminada exitosamente." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Exportación unificada sin errores de referencia
module.exports = { 
    crearReserva, 
    getMisReservas, 
    getTodasLasReservas, 
    eliminarReserva 
};