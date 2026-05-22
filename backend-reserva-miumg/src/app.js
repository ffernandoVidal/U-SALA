const express = require('express');
const cors = require('cors');
const recursoRoutes = require('./routes/recursoRoutes');
const reservaRoutes = require('./routes/reservaRoutes');

const app = express();

// 1. Capa de Middlewares Globales
app.use(cors());
app.use(express.json()); // Permite al servidor parsear payloads en formato JSON

// 2. Enrutamiento del API (Montaje de Endpoints)
app.use('/api/recursos', recursoRoutes);
app.use('/api/reservas', reservaRoutes);

// 3. Inicialización del Servidor HTTP
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` SERVER OPERATIVO & CONFIGURADO CORRECTAMENTE      `);
    console.log(` Puerto de escucha: http://localhost:${PORT}        `);
    console.log(`==================================================`);
});

module.exports = app;