const express = require('express');
const cors = require('cors');
const recursoRoutes = require('./routes/recursoRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/recursos', recursoRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/usuarios', userRoutes);

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` SERVER OPERATIVO & CONFIGURADO CORRECTAMENTE      `);
    console.log(` Puerto de escucha: http://localhost:${PORT}        `);
    console.log(`==================================================`);
});

module.exports = app;