const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres', // Asegúrate de usar el usuario correcto
    password: process.env.DB_PASSWORD || 'tu_contraseña', // Reemplaza con tu contraseña
    database: process.env.DB_NAME || 'comprobantes'
});

module.exports = pool;
