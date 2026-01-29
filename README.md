# 🖥️ CIaMS GESTOR V1

Sistema integral para la gestión de activos de TI, control de inventario, incidencias y mantenimiento, potenciado por Inteligencia Artificial.

![Estado del Proyecto](https://img.shields.io/badge/Estado-Producción-success)
![Versión](https://img.shields.io/badge/Versión-1.0.0-blue)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20|%20MySQL%20|%20Groq%20AI-blueviolet)

## 🚀 Nuevas Características (v1.0)

### 🤖 Integración de Inteligencia Artificial
- **Chatbot Guía ("CIMS-BOT")**: Asistente virtual flotante disponible 24/7 que responde dudas sobre el funcionamiento del sistema, flujos de trabajo y significados de iconos/colores.
- **Diagnóstico Inteligente**: Módulo en la gestión de incidencias que analiza la descripción del problema y sugiere:
  - 🩺 Diagnóstico técnico probable.
  - 🛠️ Pasos de solución recomendados.
  - 📉 Nivel de riesgo (Bajo/Medio/Alto).

### 📊 Gestión Visual de Activos
- **Alertas de Desgaste**: La tabla de activos ahora incluye una columna **"N° Incidencias"**.
  - 🔴 **Icono Rojo 🛠️**: Indica activos problemáticos con historial de fallas reportadas.
  - ⚪ **Gris**: Indica equipos estables sin reportes previos.
- **Filtros Avanzados**: Búsqueda por área, estado y asignación en tiempo real.

### 🛡️ Auditoría y Seguridad
- **Manejo de Errores Centralizado**: Sistema robusto que captura y estandariza errores de validación, base de datos y autenticación.
- **Protección**: Implementación de Rate Limiting, Helmet (Headers seguros) y prevención de contaminación de parámetros (HPP).

---

## 📋 Módulos Principales

1. **Gestión de Activos**: CRUD completo, asignación a empleados, control de estados (Disponible, Pérdida, Mantenimiento).
2. **Gestión de Empleados**: Registro con validación de datos y asignación automática de áreas.
3. **Mesa de Ayuda (Incidencias)**: 
   - Ciclo de vida completo: Reporte ➝ Diagnóstico IA ➝ Mantenimiento ➝ Solución.
   - Control de tiempos (Fecha reporte vs. Fecha solución).
4. **Usuarios y Roles**: Sistema de login seguro (JWT) con roles de Administrador y Usuario Estándar.

## 🛠️ Tecnologías

- **Backend**: Node.js, Express.
- **Base de Datos**: MySQL (Uso intensivo de Stored Procedures).
- **IA**: OpenAI SDK conectado a **Groq (Llama-3.3-70b)** para inferencia de alta velocidad.
- **Frontend**: HTML5, CSS3 (Diseño Responsive), JavaScript Vanilla.
- **Seguridad**: BCrypt, JWT, Helmet, Express-Rate-Limit.

## ⚙️ Instalación y Configuración

1. **Clonar el repositorio**:
   ```bash
   git clone <url-del-repo>
   cd cims-gestor
Instalar dependencias:

Bash
npm install
Configurar Variables de Entorno (.env): Crea un archivo .env en la raíz con lo siguiente:

Fragmento de código
# Base de Datos
DB_HOST=tu_host
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=gestcims_gestionactivosti

# Servidor
PORT=3000
NODE_ENV=production

# Seguridad
JWT_SECRET=tu_clave_secreta_super_segura

# Inteligencia Artificial (Groq Cloud)
OPENAI_API_KEY=gsk_tu_api_key_de_groq_aqui
Iniciar:

Bash
npm start
📄 Estructura de Directorios Clave
├── middleware/         # 🛡️ Lógica de seguridad y manejo de errores
├── public/             # 🎨 Frontend (HTML/JS/CSS)
│   ├── chatbot.js      # Lógica del asistente virtual
│   └── ...
├── routes/             # 🛣️ Rutas de la API
│   ├── iaRoutes.js     # Conexión con el servicio de IA
│   └── ...
├── utils/              # 🔧 Utilidades y clases de error personalizadas
└── server.js           # Punto de entrada
👨‍💻 Autor
Sistema desarrollado para optimizar la gestión de infraestructura TI empresarial.


---

### 📄 Archivo 2: `DEPLOY.md`
*(Actualiza la sección "C. Crear Archivo .env" para incluir la IA)*

```markdown
#### C. Crear Archivo .env
Crea un archivo `.env` en la raíz del proyecto. **¡IMPORTANTE!** Ahora se requiere la clave de API para la IA.

```env
# Configuración de Base de Datos
DB_HOST=tu_host_de_mysql
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=nombre_de_tu_base_de_datos
DB_PORT=3306

# Configuración del Servidor
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=[https://tu-dominio.com](https://tu-dominio.com)

# Seguridad (⚠️ CAMBIAR por una clave única)
JWT_SECRET=tu_clave_secreta_super_segura_aqui

# Inteligencia Artificial (Groq)
# Requerido para el Chatbot y el Diagnóstico de Incidencias
OPENAI_API_KEY=gsk_tu_clave_api_de_groq
📄 Archivo 3: ERROR_HANDLING.md
(Añade esto al final de la sección "Componentes" para documentar la IA)

Markdown
### 4. Manejo de Errores en Servicios Externos (IA)

Para las integraciones con APIs externas (como Groq/OpenAI en `iaRoutes.js`), el sistema implementa:
- **Bloques Try-Catch**: Capturan fallos de red o de la API externa.
- **Fallbacks**: Si la IA falla, el sistema devuelve un mensaje amigable al usuario (`500: El asistente está en mantenimiento`) sin tumbar el servidor.
- **Logging**: Se registra el error específico de la API en la consola del servidor para depuración, pero no se expone al cliente.