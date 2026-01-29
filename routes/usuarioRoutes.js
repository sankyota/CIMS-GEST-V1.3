const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');

// 1. GET: Obtener todos los usuarios
router.get('/usuarios', (req, res) => {
    const query = 'SELECT id, username, correo, administrador FROM usuario';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener usuarios:', err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.status(200).json(results);
    });
});

// 2. GET: Obtener usuarios no administradores
router.get('/usuarios/noadmin', (req, res) => {
    const query = 'SELECT id, username, correo, administrador FROM usuario WHERE administrador = 0';
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error al obtener usuarios no admin:', err);
            return res.status(500).json({ error: 'Error BD' });
        }
        res.status(200).json(results);
    });
});

// 3. GET: Obtener un usuario por correo
router.get('/usuarios/:correo', (req, res) => {
    const { correo } = req.params;
    db.query('CALL sp_obtener_usuario_por_correo(?)', [correo], (err, results) => {
        if (err) { return res.status(500).json({ error: 'Error BD' }); }
        if (!results[0] || results[0].length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json(results[0][0]);
    });
});

// 4. POST: Crear un nuevo usuario (CORREGIDO: Insert directo para evitar errores del SP)
router.post('/usuarios', async (req, res) => {
    try {
        const { username, correo, contrasena, administrador } = req.body; 

        if (!username || !correo || !contrasena) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        
        // Aseguramos que sea 1 o 0
        // Acepta true, "true", 1, "1" -> 1. Todo lo demás -> 0
        const esAdmin = (administrador === true || administrador === 'true' || administrador === 1 || administrador === '1') ? 1 : 0;

        // CAMBIO CLAVE: Usamos INSERT INTO directo en lugar de CALL sp_...
        // Esto garantiza que el 1 llegue a la columna 'administrador' sin intermediarios.
        const query = 'INSERT INTO usuario (username, correo, contrasena, administrador) VALUES (?, ?, ?, ?)';

        db.query(query, [username, correo, hashedPassword, esAdmin], (err, result) => {
            if (err) {
                // Manejo de error de duplicados (ej: correo ya existe)
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'El usuario o correo ya existe' });
                }
                console.error('❌ Error al registrar usuario:', err);
                return res.status(500).json({ error: 'Error al registrar usuario en BD' });
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente' });
        });
    } catch (error) {
        console.error('❌ Error en el servidor (Hash):', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 5. PUT: Actualizar usuario
router.put('/usuarios/:correo', (req, res) => {
    const { correo } = req.params;
    const { username, contrasena, administrador } = req.body;
    let contrasenaHashed = null; 

    const adminValue = (administrador !== undefined && administrador !== null) 
        ? (administrador === true || administrador === 'true' || administrador === 1 || administrador === '1' ? 1 : 0) 
        : null;

    const actualizar = () => {
        db.query(
            'CALL sp_actualizar_usuario_por_correo(?, ?, ?, ?)',
            [correo, username || null, contrasenaHashed, adminValue],
            (err, result) => {
                if (err) { return res.status(500).json({ error: 'Error BD' }); }
                if (result.affectedRows === 0) { return res.status(404).json({ error: 'Usuario no encontrado' }); }
                res.status(200).json({ message: 'Usuario actualizado' });
            }
        );
    };

    if (contrasena) {
        bcrypt.hash(contrasena, 10, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Error hash' });
            contrasenaHashed = hash;
            actualizar();
        });
    } else {
        actualizar();
    }
});

// 6. DELETE
router.delete('/usuarios/:correo', (req, res) => {
    const { correo } = req.params;
    db.query('CALL sp_eliminar_usuario_por_correo(?)', [correo], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error BD' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.status(200).json({ message: 'Usuario eliminado' });
    });
});

module.exports = router;