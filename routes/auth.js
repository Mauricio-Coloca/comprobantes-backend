const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');
const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)',
            [nombre, email, hashedPassword]
        );
        res.status(201).send('Usuario registrado');
    } catch (error) {
        res.status(500).send('Error al registrar usuario');
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.status(404).send('Usuario no encontrado');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).send('Contraseña incorrecta');

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).send('Error al iniciar sesión');
    }
});

module.exports = router;
