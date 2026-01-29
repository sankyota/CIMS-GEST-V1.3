const API_URL = "api/activos";
const API_URL_EMPLEADOS = "api/empleados";
const API_URL_ASIGNACIONES = "api/asignaciones";

const tbody = document.querySelector(".data-table tbody");
const searchInput = document.getElementById("search");
const searchButton = document.getElementById("search-button");
const estadoFilter = document.getElementById("filtro-estado");
const asignadoFilter = document.getElementById("filtro-asignado");
const areaFilter = document.getElementById("filtro-area"); 

// --- VARIABLES DE PAGINACIÓN ---
let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;

// Obtener empleados
const getEmpleados = async () => {
    try {
        const response = await fetch(API_URL_EMPLEADOS, { credentials: 'include' });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("❌ Error al obtener empleados:", error);
        return [];
    }
};

// Actualizar estado
const actualizarEstado = async (activoId, estado) => {
    try {
        const response = await fetch(`${API_URL}/${activoId}/estado`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: estado }),
        });
        if (!response.ok) throw new Error(`❌ Error al actualizar estado. Código: ${response.status}`);
        
        alert("✅ Estado actualizado correctamente.");
        loadActivos(searchInput ? searchInput.value.trim() : "");
    } catch (error) {
        console.error("❌ Error al actualizar estado:", error);
    }
};

// Asignar nuevo activo
const asignarNuevoActivo = async (activoId, empleadoId) => {
  try {
    const fechaAsignacion = new Date().toISOString().split("T")[0];
    const response = await fetch(`${API_URL}/${activoId}/asignar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        empleado_id: empleadoId,
        fecha_asignacion: fechaAsignacion
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Error al asignar el activo");

    alert("✅ Activo asignado correctamente.");
    loadActivos(searchInput ? searchInput.value.trim() : "");
  } catch (error) {
    console.error("❌ Error al asignar activo:", error);
  }
};

// Cargar activos
const loadActivos = async (filter = "") => {
    try {
        const response = await fetch(API_URL, { credentials: 'include' });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const data = await response.json();
        const empleados = await getEmpleados();

        // Procesar empleados únicos
        const empleadosUnicos = [];
        const idsVistos = new Set();
        empleados.forEach(emp => {
            if (!idsVistos.has(emp.id)) {
                empleadosUnicos.push(emp);
                idsVistos.add(emp.id);
            }
        });

        const empleadosMap = empleadosUnicos.reduce((map, emp) => {
            map[emp.id] = { nombre: emp.nombre, area_id: emp.area_id };
            return map;
        }, {});

        const activosConEmpleados = data.map(item => ({
            ...item,
            nombre_empleado: item.empleado_id_asignado
            ? (empleadosMap[item.empleado_id_asignado]?.nombre || "Desconocido")
            : "No asignado",
            area: item.area || "Sin área"
        }));

        // Llenar filtro de áreas si está vacío
        if (areaFilter && areaFilter.options.length <= 1) { 
            const currentArea = areaFilter.value; 
            const areasUnicas = [...new Set(activosConEmpleados.map(i => i.area).filter(Boolean))];
            areaFilter.innerHTML = '<option value="">Todas las áreas</option>';
            areasUnicas.forEach(area => {
                const option = document.createElement("option");
                option.value = area;
                option.textContent = area;
                if (area === currentArea) option.selected = true; 
                areaFilter.appendChild(option);
            });
        }

        // Filtros actuales
        const estadoSeleccionado = estadoFilter ? estadoFilter.value : "";
        const asignadoSeleccionado = asignadoFilter ? asignadoFilter.value : "";
        const areaSeleccionada = areaFilter ? areaFilter.value : "";
  
        const filteredData = activosConEmpleados.filter(item => {
            const searchTerm = filter.toLowerCase();
            const coincideBusqueda =
            (item.ItemCode && item.ItemCode.toLowerCase().includes(searchTerm)) ||
            (item.ItemName && item.ItemName.toLowerCase().includes(searchTerm)) ||
            (item.marca && item.marca.toLowerCase().includes(searchTerm)) ||
            (item.modelo && item.modelo.toLowerCase().includes(searchTerm)) ||
            (item.area && item.area.toLowerCase().includes(searchTerm));

            const coincideEstado = !estadoSeleccionado || item.estado === estadoSeleccionado;
            const coincideAsignado =
                !asignadoSeleccionado ||
                (asignadoSeleccionado === "asignado" && item.empleado_id_asignado && item.estado !== "Pérdida") ||
                (asignadoSeleccionado === "no_asignado" && !item.empleado_id_asignado);

            const coincideArea = !areaSeleccionada || item.area === areaSeleccionada;

            return coincideBusqueda && coincideEstado && coincideAsignado && coincideArea;
        });

        // Paginación
        totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = 1;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = filteredData.slice(startIndex, endIndex);
        
        renderPaginationControls(); 

        if (!paginatedItems.length) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align: center;">
                ${filter ? "No se encontraron activos." : "No hay activos disponibles."}
            </td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        paginatedItems.forEach(item => {
            const fechaCompra = item.fecha_compra ? item.fecha_compra.split("T")[0] : "No disponible";
            const marca = item.marca && item.marca.trim() ? item.marca : "No especificada";
            const modelo = item.modelo && item.modelo.trim() ? item.modelo : "No especificado";

            // Lógica Incidencias (ROJO)
            let incidenciasHtml = `<span style="color: #ccc;">0</span>`;
            if (item.total_incidencias > 0) {
                incidenciasHtml = `<span style="color: red; font-weight: bold; font-size: 1.2em;">${item.total_incidencias} 🛠️</span>`;
            }

            // Selectores de tabla
            const estadoSelect = document.createElement("select");
            estadoSelect.classList.add("estado-select");
            ["Disponible", "Pérdida"].forEach(estado => {
                const option = document.createElement("option");
                option.value = estado;
                option.textContent = estado;
                if (item.estado === estado) option.selected = true;
                estadoSelect.appendChild(option);
            });

            const actualizarEstadoButton = document.createElement("button");
            actualizarEstadoButton.textContent = "Guardar";
            actualizarEstadoButton.classList.add("btn-update");
            actualizarEstadoButton.addEventListener("click", () => actualizarEstado(item.id, estadoSelect.value));

            const propietarioSelect = document.createElement("select");
            propietarioSelect.classList.add("propietario-select");
            const placeholderOption = document.createElement("option");
            placeholderOption.value = "";
            placeholderOption.disabled = true;
            placeholderOption.textContent = "Seleccione un empleado";
            placeholderOption.selected = !item.empleado_id_asignado;
            propietarioSelect.appendChild(placeholderOption);

            empleadosUnicos.forEach(emp => {
                const option = document.createElement("option");
                option.value = emp.id;
                option.textContent = empleadosMap[emp.id]?.nombre || "Empleado sin nombre";
                if (item.empleado_id_asignado === emp.id) option.selected = true;
                propietarioSelect.appendChild(option);
            });

            const actualizarPropietarioButton = document.createElement("button");
            actualizarPropietarioButton.textContent = "Guardar";
            actualizarPropietarioButton.classList.add("btn-update");
            actualizarPropietarioButton.addEventListener("click", () => {
                const empleadoId = propietarioSelect.value;
                if (!empleadoId) return alert("Por favor, seleccione un empleado.");
                asignarNuevoActivo(item.id, empleadoId);
            });

            // Construcción Fila
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.ItemCode || "N/A"}</td>
                <td>${item.ItemName || "N/A"}</td>
                <td>${marca}</td>
                <td>${modelo}</td>
                <td>${fechaCompra}</td>
                <td>${item.Price ? `$${parseFloat(item.Price).toFixed(2)}` : "No disponible"}</td>
                <td>${item.Currency || "USD"}</td>
                <td>${item.area || "Sin área"}</td>
                <td style="text-align: center;">${incidenciasHtml}</td>
            `;

            const estadoCell = document.createElement("td");
            estadoCell.appendChild(estadoSelect);
            estadoCell.appendChild(actualizarEstadoButton);
            row.appendChild(estadoCell);

            const propietarioCell = document.createElement("td");
            if (item.estado === "Pérdida") {
                propietarioCell.textContent = "No asignable";
                propietarioCell.style.color = "gray";
                propietarioCell.style.textAlign = "center";
            } else {
                propietarioCell.appendChild(propietarioSelect);
                propietarioCell.appendChild(actualizarPropietarioButton);
            }
            row.appendChild(propietarioCell);

            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("❌ Error al cargar activos:", error);
        tbody.innerHTML = `<tr><td colspan="11" style="text-align: center;">Error al cargar activos.</td></tr>`;
    }   
};

// --- RENDER PAGINATION ---
const renderPaginationControls = () => {
    let paginationContainer = document.getElementById("pagination-controls");
    if (!paginationContainer) {
        const tableContainer = document.querySelector(".table-container") || document.querySelector(".data-table");
        if (tableContainer) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "pagination-controls";
            paginationContainer.className = "pagination-controls";
            tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);
        } else { return; }
    }

    paginationContainer.innerHTML = "";

    const prevButton = document.createElement("button");
    prevButton.textContent = "⬅ Anterior";
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            loadActivos(searchInput ? searchInput.value.trim() : "");
        }
    };

    const nextButton = document.createElement("button");
    nextButton.textContent = "Siguiente ➡";
    nextButton.disabled = currentPage >= totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadActivos(searchInput ? searchInput.value.trim() : "");
        }
    };
    
    const pageInfo = document.createElement("span");
    pageInfo.textContent = ` Página ${currentPage} de ${totalPages > 0 ? totalPages : 1} `;

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
};

// --- FUNCIONES EXPORTAR (Sin modal ni listeners aquí, solo lógica) ---
async function exportarPDF() {
    const [activosRes, empleadosRes] = await Promise.all([
        fetch(API_URL, { credentials: "include" }),
        fetch(API_URL_EMPLEADOS, { credentials: "include" }),
    ]);

    const activos = await activosRes.json();
    const empleados = await empleadosRes.json();

    const estadoFiltro = document.getElementById("filtro-estado") ? document.getElementById("filtro-estado").value : "";
    const asignadoFiltro = document.getElementById("filtro-asignado") ? document.getElementById("filtro-asignado").value : "";
    const areaFiltro = document.getElementById("filtro-area") ? document.getElementById("filtro-area").value : "";

    let activosFiltrados = activos;

    if (estadoFiltro) activosFiltrados = activosFiltrados.filter(a => a.estado === estadoFiltro);
    if (asignadoFiltro === "asignado") activosFiltrados = activosFiltrados.filter(a => a.empleado_id_asignado && a.estado !== "Pérdida");
    else if (asignadoFiltro === "no_asignado") activosFiltrados = activosFiltrados.filter(a => !a.empleado_id_asignado);
    if (areaFiltro) activosFiltrados = activosFiltrados.filter(a => a.area === areaFiltro);

    const empleadoMap = {};
    empleados.forEach(e => { empleadoMap[e.id] = e.nombre; });

    const fechaReporte = new Date().toLocaleString();
    const jspdfLib = window.jspdf || window.jsPDF;
    if (!jspdfLib) return alert("Error: La librería jsPDF no se encontró.");
    
    const { jsPDF } = jspdfLib.umd ? jspdfLib.umd : (typeof jspdfLib === 'function' ? { jsPDF: jspdfLib } : jspdfLib);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reporte de Activos", 14, 20);
    doc.setFontSize(10);
    doc.text(`Fecha del reporte: ${fechaReporte}`, 14, 28);

    const rowsPDF = activosFiltrados.map(activo => [
        activo.ItemCode || "N/A",
        activo.ItemName || "N/A",
        activo.marca || "No especificada",
        activo.modelo || "No especificado",
        activo.fecha_compra ? activo.fecha_compra.split("T")[0] : "No disponible",
        activo.Price ? `$${activo.Price.toFixed(2)}` : "No disponible",
        activo.Currency || "USD",
        activo.estado || "No especificado",
        empleadoMap[activo.empleado_id_asignado] || "No asignado",
        activo.area || "Sin área",
        activo.total_incidencias || 0 
    ]);

    doc.autoTable({
        head: [["Código", "Nombre", "Marca", "Modelo", "Fecha Compra", "Precio", "Moneda", "Estado", "Asignado a", "Área", "N° Incidencias"]],
        body: rowsPDF,
        startY: 35
    });

    doc.save("reporte_activos.pdf");
}

async function exportarExcel() {
  const [activosRes, empleadosRes] = await Promise.all([
    fetch(API_URL, { credentials: "include" }),
    fetch(API_URL_EMPLEADOS, { credentials: "include" }),
  ]);

  const activos = await activosRes.json();
  const empleados = await empleadosRes.json();

  const empleadoMap = {};
  empleados.forEach(e => { empleadoMap[e.id] = e.nombre; });

  const estadoFiltro = document.getElementById("filtro-estado") ? document.getElementById("filtro-estado").value : "";
  const asignadoFiltro = document.getElementById("filtro-asignado") ? document.getElementById("filtro-asignado").value : "";
  const areaFiltro = document.getElementById("filtro-area") ? document.getElementById("filtro-area").value : "";

  let activosFiltrados = activos;

  if (estadoFiltro) activosFiltrados = activosFiltrados.filter(a => a.estado === estadoFiltro);
  if (asignadoFiltro === "asignado") activosFiltrados = activosFiltrados.filter(a => a.empleado_id_asignado && a.estado !== "Pérdida");
  else if (asignadoFiltro === "no_asignado") activosFiltrados = activosFiltrados.filter(a => !a.empleado_id_asignado);
  if (areaFiltro) activosFiltrados = activosFiltrados.filter(a => a.area === areaFiltro);

  const rows = [
    ["Código", "Nombre", "Marca", "Modelo", "Fecha Compra", "Precio", "Moneda", "Estado", "Asignado a", "Área", "N° Incidencias"],
    ...activosFiltrados.map(activo => [
      activo.ItemCode || "N/A",
      activo.ItemName || "N/A",
      activo.marca || "No especificada",
      activo.modelo || "No especificado",
      activo.fecha_compra ? activo.fecha_compra.split("T")[0] : "No disponible",
      activo.Price ? `$${activo.Price.toFixed(2)}` : "No disponible",
      activo.Currency || "USD",
      activo.estado || "No especificado",
      empleadoMap[activo.empleado_id_asignado] || "No asignado",
      activo.area || "Sin área",
      activo.total_incidencias || 0
    ])
  ];

  if (typeof XLSX === 'undefined') return alert("La librería de Excel aún no ha cargado.");
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Activos");
  XLSX.writeFile(wb, "reporte_activos.xlsx");
}

// --- EVENT LISTENERS (DOM LOADED) ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar Datos
    loadActivos();

    // 2. Filtros y Búsqueda
    if (searchButton) searchButton.addEventListener("click", () => { currentPage = 1; loadActivos(searchInput.value.trim()); });
    if (searchInput) searchInput.addEventListener("input", () => { currentPage = 1; loadActivos(searchInput.value.trim()); });
    if (estadoFilter) estadoFilter.addEventListener("change", () => {
        currentPage = 1;
        if (estadoFilter.value === "Pérdida" && asignadoFilter) { asignadoFilter.disabled = true; asignadoFilter.value = ""; } 
        else if (asignadoFilter) { asignadoFilter.disabled = false; }
        loadActivos(searchInput ? searchInput.value.trim() : "");
    });
    if (asignadoFilter) asignadoFilter.addEventListener("change", () => { currentPage = 1; loadActivos(searchInput ? searchInput.value.trim() : ""); });
    if (areaFilter) areaFilter.addEventListener("change", () => { currentPage = 1; loadActivos(searchInput ? searchInput.value.trim() : ""); });

    // 3. LÓGICA DEL MODAL DE EXPORTACIÓN (SEGURA)
    const exportModal = document.getElementById("exportModal");
    const btnOpen = document.getElementById("btn-exportar-todo");
    const btnClose = document.getElementById("modal-close");
    const btnPdf = document.getElementById("btn-confirm-pdf");
    const btnExcel = document.getElementById("btn-confirm-excel");

    // Abrir Modal
    if (btnOpen) {
        btnOpen.addEventListener("click", () => {
            if (exportModal) exportModal.style.display = "flex";
        });
    }

    // Cerrar Modal
    const cerrarModal = () => {
        if (exportModal) exportModal.style.display = "none";
    };

    if (btnClose) btnClose.addEventListener("click", cerrarModal);

    // Cerrar si clic fuera
    window.addEventListener("click", (event) => {
        if (event.target === exportModal) cerrarModal();
    });

    // Acción PDF
    if (btnPdf) {
        btnPdf.addEventListener("click", async () => {
            cerrarModal();
            Swal.fire({ title: 'Generando PDF...', didOpen: () => Swal.showLoading() });
            await exportarPDF();
            Swal.close();
        });
    }

    // Acción Excel
    if (btnExcel) {
        btnExcel.addEventListener("click", async () => {
            cerrarModal();
            Swal.fire({ title: 'Generando Excel...', didOpen: () => Swal.showLoading() });
            await exportarExcel();
            Swal.close();
        });
    }
});