const pool = require('../config/db');

const crearReserva = async (req, res) => {
    const { usuario_id, recurso_id, inicio, fin, notas } = req.body;

    try {
        const query = `
            INSERT INTO reservas (usuario_id, recurso_id, inicio, fin, notas)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [usuario_id, recurso_id, inicio, fin, notas];
        
        const result = await pool.query(query, values);
        
        res.status(201).json({
            message: "Reserva creada exitosamente",
            reserva: result.rows[0]
        });

    } catch (error) {
        console.error("DETALLE TÉCNICO RESERVA:", error.code, error.message);

        // Captura de la restricción de exclusión (Solapamiento)
        if (error.code === '23P01') { // Código de PostgreSQL para Exclusion Violation
            return res.status(409).json({
                error: "Conflicto de horario",
                message: "El recurso ya está reservado en el horario seleccionado."
            });
        }

        res.status(500).json({
            error: "Internal Server Error",
            message: "No se pudo procesar la reserva.",
            detail: error.message
        });
    }
};

const getMisReservas = async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const result = await pool.query(
            'SELECT r.*, rec.nombre as recurso_nombre FROM reservas r JOIN recursos rec ON r.recurso_id = rec.id WHERE r.usuario_id = $1 ORDER BY r.inicio DESC',
            [usuario_id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener reservas" });
    }
};

module.exports = { crearReserva, getMisReservas };