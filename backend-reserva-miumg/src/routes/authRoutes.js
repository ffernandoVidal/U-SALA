// 1. Importaciones necesarias (Fundamento del módulo)
const express = require('express');
const router = express.Router(); // <--- ESTA LÍNEA DEFINE LA VARIABLE 'router'
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { findOrCreateUser } = require('../services/userService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 2. Definición de la lógica de autenticación
router.post('/google', async (req, res) => {
    const { token } = req.body; 
    console.log("1. Intento de login recibido en el backend");

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        // Validación estricta de dominio UMG
        if (!payload.email.endsWith('@miumg.edu.gt')) {
            return res.status(403).json({ 
                error: "Acceso denegado. Solo correos @miumg.edu.gt son permitidos." 
            });
        }

        const user = await findOrCreateUser({
            email: payload.email,
            nombre_completo: payload.name,
            google_id: payload.sub
        });

        const internalToken = jwt.sign(
            { userId: user.id, role: user.role_id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token: internalToken, user });

    } catch (error) {
        console.error('Error en Auth:', error.message);
        res.status(401).json({ error: "Token de Google inválido" });
    }
});

// 3. Exportación para que app.js pueda usarlo
module.exports = router;