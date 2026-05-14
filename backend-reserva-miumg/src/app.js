const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuración de Seguridad y CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
}));

// Middleware para corregir políticas de Google (COOP)
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(express.json());

// Importación de rutas
const recursoRoutes = require('./routes/recursoRoutes');
const authRoutes = require('./routes/authRoutes');
const reservaRoutes = require('./routes/reservaRoutes');

// Endpoints
app.use('/api/recursos', recursoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reservas', reservaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Ingeniería corriendo en puerto ${PORT}`);
});