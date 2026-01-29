// --- GESTIÓN DE TOKEN Y AUTENTICACIÓN ---
const getToken = () => localStorage.getItem('token');

const setAuthHeader = (headers = {}) => {
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.warn("No se encontró token para setAuthHeader");
    }
    return headers;
};

const logout = () => {
    console.log("Cerrando sesión...");
    localStorage.removeItem('token');
    // Limpiar cookies también por seguridad
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = "/login.html";
};

const checkAuth = async () => {
    const token = getToken();
    if (!token) {
        console.log("No hay token, redirigiendo a login");
        // Si no estamos ya en el login, redirigir
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = "/login.html";
        }
        return null;
    }
    try {
        const response = await fetch("/api/user", {
            headers: setAuthHeader()
        });
        if (!response.ok) {
            throw new Error('Token inválido o expirado');
        }
        return await response.json();
    } catch (error) {
        console.error("Error sesión:", error);
        logout();
        return null;
    }
};


// Se ejecuta automáticamente apenas se carga este archivo
(function aplicarTemaGuardado() {
    const primary = localStorage.getItem('cims_primary');
    const accent = localStorage.getItem('cims_accent');
    
    if (primary && accent) {
        // Aplicamos los colores al documento entero
        document.documentElement.style.setProperty('--primary-color', primary);
        document.documentElement.style.setProperty('--accent-color', accent);
    }
})();