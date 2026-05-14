const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Eliminamos configuraciones extra para asegurar conectividad base (O(1))
});

// Verificación de salud de la conexión
pool.on('connect', () => {
    console.log('✅ Conexión exitosa a PostgreSQL (USALADB)');
});

pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de conexiones:', err);
});

module.exports = pool; // Exportación directa

