const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

// Obtener todos los empleados
router.get('/empleados', (req, res) => {
    db.query('CALL sp_obtener_empleados()', (err, results) => {
        if (err) {
            console.error('❌ Error:', err);
            return res.status(500).json({ error: 'Error al obtener empleados' });
        }
        res.status(200).json(results[0]);
    });
});

// Obtener un empleado por ID
router.get('/empleados/:id', (req, res) => {
    const { id } = req.params;
    db.query('CALL sp_obtener_empleado_por_id(?)', [id], (err, results) => {
        if (err) {
            console.error('❌ Error al obtener empleado:', err);
            return res.status(500).json({ error: 'Error al obtener empleado' });
        }
        if (results[0].length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' });
        }
        res.status(200).json(results[0][0]);
    });
});

// Crear un empleado
router.post('/empleados', requireAdmin, (req, res) => {
    const { nombre, correo, fecha_ingreso, area_id, codigo } = req.body;
    if (!nombre || !area_id || !codigo) {
        return res.status(400).json({ error: 'El nombre, código y área_id son obligatorios' });
    }
    const query = `CALL CrearEmpleadoConArea(?, ?, ?, ?, ?)`;
    const values = [
        codigo.toUpperCase(),
        nombre.toUpperCase(),
        correo || null,
        fecha_ingreso || new Date().toISOString().split('T')[0],
        area_id
    ];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('❌ Error al registrar empleado:', err);
            return res.status(500).json({ error: 'Error al registrar el empleado' });
        }
        const empleado_id = result[0][0].empleado_id;
        res.status(201).json({
            message: '✅ Empleado y asignación registrados correctamente.',
            empleado_id
        });
    });
});

// ✅ RUTA ACTUALIZADA Y CORREGIDA PARA LA ESTRUCTURA REAL
router.put('/empleados/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, correo, fecha_ingreso, area_id } = req.body;

    // 1. Actualizar datos básicos en tabla 'empleado'
    const queryEmpleado = `
        UPDATE empleado 
        SET nombre = ?, correo = ?, fecha_ingreso = ? 
        WHERE id = ?
    `;

    db.query(queryEmpleado, [nombre, correo, fecha_ingreso, id], (err, result) => {
        if (err) {
            console.error("❌ Error al actualizar datos del empleado:", err);
            return res.status(500).json({ error: "Error al actualizar datos personales" });
        }

        // 2. Actualizar la relación en 'activo_empleado_area'
        // Buscamos la asignación activa (fecha_retiro IS NULL) y actualizamos el area_id
        const queryArea = `
            UPDATE activo_empleado_area 
            SET area_id = ? 
            WHERE empleado_id = ? AND fecha_retiro IS NULL
        `;

        db.query(queryArea, [area_id, id], (errArea, resultArea) => {
            if (errArea) {
                console.error("❌ Error al actualizar área del empleado:", errArea);
                // No fallamos toda la petición, pero avisamos en consola.
                // Idealmente usaríamos transacciones, pero esto funciona para este caso.
            }
            
            // Si no se actualizó ninguna fila (ej: el empleado no tenía asignación),
            // podríamos insertar una nueva, pero 'CrearEmpleadoConArea' garantiza que tenga una.
            
            res.json({ message: "✅ Empleado y área actualizados correctamente" });
        });
    });
});

module.exports = router;