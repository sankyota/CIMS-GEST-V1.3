# 🖥️ CIaMS GESTOR v1.3 (Enterprise Edition)

**Sistema Integral de Gestión de Activos TI, Incidencias y Capital Humano potenciado por IA.**

![Versión](https://img.shields.io/badge/Versión-1.3.0-blue?style=for-the-badge)
![Estado](https://img.shields.io/badge/Estado-Producción-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20|%20MySQL%20|%20Groq%20AI-blueviolet?style=for-the-badge)
![Seguridad](https://img.shields.io/badge/Seguridad-JWT%20|%20Helmet%20|%20BCrypt-red?style=for-the-badge)

CIaMS GESTOR no es solo un inventario; es un ecosistema completo para departamentos de TI que centraliza el control de hardware, el soporte técnico y la administración de personal, con una interfaz moderna y personalizable.

---

## 🚀 Novedades de la Versión 1.3

### 🎨 Hub de Configuración y Personalización
Un nuevo módulo centralizado donde el usuario puede personalizar su experiencia sin afectar el backend:
* **Editor de Temas**: Cambia el color de acento de toda la aplicación (Azul, Morado, Rojo, Verde, Amarillo) con persistencia automática.
* **Zona Arcade 🕹️**: Módulo de entretenimiento integrado  para pausas activas, desarrollado en Canvas HTML5.

### 🛡️ Seguridad y Rendimiento
* **Cumplimiento CSP**: Refactorización total del frontend para cumplir con *Content Security Policy* (eliminación de scripts inline).
* **Exportación Avanzada**: Nuevo sistema de modales para exportar reportes en PDF o Excel de manera selectiva.

---

## 🧠 Características Principales

### 1. Inteligencia Artificial (Groq / Llama-3)
* **Diagnóstico Técnico Automático**: Al reportar una incidencia, la IA analiza la descripción y genera:
    * 🩺 Diagnóstico probable.
    * 🛠️ Pasos de solución paso a paso.
    * 📉 Nivel de riesgo (Bajo/Medio/Alto).
* **Chatbot Guía**: Asistente virtual 24/7 que responde preguntas sobre el uso del sistema y procesos internos.

### 2. Gestión de Activos e Incidencias
* **Trazabilidad**: Historial completo de quién tiene qué equipo y en qué área.
* **Semáforo de Estado**: Indicadores visuales para equipos "Por solucionar" (Amarillo) o "Solucionados" (Verde).
* **Alertas de Desgaste**: Icono rojo 🛠️ automático en activos que acumulan muchas fallas.

### 3. Seguridad Empresarial
* **Autenticación**: Login seguro con JWT (JSON Web Tokens) almacenados en Cookies HTTP-Only.
* **Protección**: Middlewares contra ataques de fuerza bruta (Rate Limit), cabeceras seguras (Helmet) y saneamiento de datos.

---

## 🛠️ Stack Tecnológico

* **Backend**: Node.js, Express.js.
* **Base de Datos**: MySQL (Optimizado con Stored Procedures).
* **Frontend**: HTML5, CSS3 (Variables CSS para temas), JavaScript Vanilla (ES6+).
* **IA Engine**: SDK de OpenAI conectado a la nube de Groq (Modelo Llama-3.3-70b).
* **Librerías Clave**: `sweetalert2` (UI), `jspdf` & `xlsx` (Reportes), `bcrypt` (Cifrado).

---

## ⚙️ Instalación y Despliegue

### Requisitos Previos
* Node.js v16+
* MySQL Server 8.0+

### Pasos

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/ciams-gestor.git](https://github.com/tu-usuario/ciams-gestor.git)
    cd ciams-gestor
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en la raíz:
    ```env
    # Servidor
    PORT=3000
    NODE_ENV=development

    # Base de Datos
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=tu_password
    DB_NAME=gestionactivosti

    # Seguridad (¡Cambiar en producción!)
    JWT_SECRET=super_secreto_key_123

    # Inteligencia Artificial (Groq Cloud)
    OPENAI_API_KEY=gsk_tu_api_key_de_groq
    ```

4.  **Iniciar la aplicación:**
    ```bash
    # Modo desarrollo
    npm run dev

    # Modo producción
    npm start
    ```

5.  **Acceso:**
    * Navegador: `http://localhost:3000`
    * Credenciales Admin (por defecto si ejecutaste el script SQL): `admin` / `admin123`

---

## 📂 Estructura del Proyecto

ciams-gestor/ ├── config/ # Conexiones a BD y JWT ├── middleware/ # Capa de seguridad (Auth, ErrorHandler, RateLimit) ├── public/ # Frontend (HTML, CSS, JS Cliente) │ ├── assets/ # Estilos e imágenes │ ├── configuracion.js # Lógica del Hub v1.3 │ └── ... ├── routes/ # API Endpoints ├── utils/ # Clases de error y helpers ├── server.js # Punto de entrada └── README.md # Documentación


---

## 🤝 Contribución y Soporte

Sistema desarrollado para optimizar la infraestructura ofimatica.
Para soporte, contactar al equipo de desarrollo interno o crear un *Issue* en el repositorio.

---
**© 2026 CIaMS GESTOR** - *Versión 1.3 Stable*
