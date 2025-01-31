const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rutas
const authRoutes = require('./routes/auth');
const comprobantesRoutes = require('./routes/comprobantes');

app.use('/auth', authRoutes); // Rutas para autenticación
app.use('/comprobantes', comprobantesRoutes); // Rutas para comprobantes

// Puerto del servidor
const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
