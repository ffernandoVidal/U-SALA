const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('Conectado a PostgreSQL (USALADB)');
});

pool.on('error', (err) => {
    console.error('Error en el pool de conexiones:', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
