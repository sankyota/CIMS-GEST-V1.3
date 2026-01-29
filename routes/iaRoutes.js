const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// 🔌 CONFIGURACIÓN DE GROQ
const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY, 
    baseURL: "https://api.groq.com/openai/v1" 
});

// 🧠 RUTA IA: DIAGNÓSTICO INTELIGENTE
router.post('/sugerir-solucion', async (req, res) => {
    const { descripcion, activo_modelo } = req.body;

    if (!descripcion) {
        return res.status(400).json({ error: 'Por favor, describe el problema.' });
    }

    try {
        const completion = await openai.chat.completions.create({
            // ✅ CAMBIO IMPORTANTE: Usamos el modelo nuevo (Llama 3.3)
            model: "llama-3.3-70b-versatile", 
            messages: [
                { 
                    role: "system", 
                    content: `Eres un Técnico Senior de Soporte TI (Nivel 3).
                    Tu trabajo es analizar fallas de equipos y dar diagnósticos precisos.
                    
                    REGLAS DE RESPUESTA:
                    1. Responde SIEMPRE en formato JSON válido.
                    2. El JSON debe tener esta estructura exacta:
                       {
                         "diagnostico": "Explica qué está fallando probablemente (máx 20 palabras)",
                         "pasos": ["Paso 1 técnico", "Paso 2 técnico", "Paso 3 técnico"],
                         "riesgo": "bajo" o "medio" o "alto"
                       }
                    3. Sé directo y técnico.` 
                },
                { 
                    role: "user", 
                    content: `Equipo: ${activo_modelo || "No especificado"}. 
                    Falla reportada: "${descripcion}". 
                    Dame el diagnóstico en JSON.` 
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
        });

        const respuestaIA = JSON.parse(completion.choices[0].message.content);
        res.json(respuestaIA);

    } catch (error) {
        console.error("❌ Error conectando con Groq:", error);
        res.status(500).json({ error: "El asistente virtual no pudo procesar la solicitud." });
    }
});
// 🤖 RUTA CHATBOT GUÍA: Asistente experto en CIaMS GESTOR (Versión Corregida)
router.post('/chat-guia', async (req, res) => {
    const { mensaje } = req.body;

    if (!mensaje) return res.status(400).json({ error: 'Mensaje vacío' });

    // 📖 MANUAL EXACTO DEL SISTEMA (Basado en tu descripción)
    const manualSistema = `
    Eres "CIaMS-BOT", el Asistente Técnico del sistema "CIaMS GESTOR".
    Tu conocimiento se basa ESTRICTAMENTE en la siguiente estructura funcional:

    1. 🏠 NAVEGACIÓN Y ESTRUCTURA GENERAL:
       - **Index (Inicio)**: Contiene 4 módulos fijos: "Ver Activos", "Registrar Activos", "Registrar Incidencia" y "Registrar Empleados".
       - **Navbar**: Visible en todas las páginas. Tiene accesos rápidos (Ver Activos, Ver Incidencias, Ver Empleados) y un botón de engranaje ⚙️ para Configuraciones.

    2. 👥 GESTIÓN DE EMPLEADOS:
       - **Registro**: Se requieren obligatoriamente: Código (Documento de Identidad), Nombre, Correo, Selección de Área (pre-cargada en BD) y Fecha de Ingreso.
       - **Gestión**: Se puede consultar la lista y modificar los datos de cualquier empleado existente.

    3. 🖥️ MÓDULO DE ACTIVOS DISPONIBLES ("Ver Activos"):
       - **Tabla de Datos**: Muestra Código Producto (Barcode), Nombre, Marca, Modelo, Fecha Compra, Precio, Moneda, Área y **N° Incidencias** (conteo histórico de fallas).
       - **Lógica de Área**: ¡Importante! El Área del activo cambia automáticamente cuando se asigna a un empleado diferente (hereda el área del empleado).
       - **Estados**:
         * "Disponible": Equipo operativo.
         * "Pérdida": Abarca Robado, Extraviado o No Operativo.
       - **Herramientas**: Filtros (por Área, Estado, Asignado/No Asignado), Barra de búsqueda y Exportación (PDF y XLSX).

    4. ⚠️ REGISTRO DE INCIDENCIAS:
       - **Flujo**:
         1. Buscas/Seleccionas el activo (lista automática).
         2. **Automático**: El sistema carga la info del activo y del empleado que lo usa actualmente.
         3. **Manual**: Debes seleccionar el "Usuario que registra" y escribir la "Descripción" (Resumen del fallo).

    5. 📋 CONSULTA DE INCIDENCIAS ("Ver Incidencias"):
       - **Tabla**: Activo, Área, Empleado, Descripción, Fecha Reporte, Fecha Solución, **Diagnóstico IA**, Estado y Acciones.
       - **Estados y Colores**:
         * 🟡 **Amarillo**: Pendiente de Mantención.
         * 🟢 **Verde**: Incidencia Solucionada (Se logra pulsando el botón "Solucionar").
       - **Interacciones**:
         * Clic en Nombre Activo: Abre popup con detalles técnicos del equipo.
         * Clic en "Ver más" (descripción): Muestra el texto completo del reporte.
         * **Diagnóstico IA**: Columna que ofrece análisis inteligente de la falla.
       - **Herramientas**: Filtros (Área, Estado), Búsqueda y Exportación (PDF y XLSX).

    REGLAS DE RESPUESTA:
    - Sé directo y técnico.
    - Si preguntan cómo cambiar el área de un activo, explica que se hace reasignando al empleado.
    - Si preguntan qué es "Pérdida", aclara que incluye robos o equipos inoperativos.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile", 
            messages: [
                { role: "system", content: manualSistema },
                { role: "user", content: mensaje }
            ],
            temperature: 0.3, 
            max_tokens: 350
        });

        const respuesta = completion.choices[0].message.content;
        res.json({ respuesta });

    } catch (error) {
        console.error("❌ Error Chatbot:", error);
        res.status(500).json({ error: "El asistente está reiniciando sus sistemas. Intenta en un momento." });
    }
});
module.exports = router;