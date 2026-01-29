const API_URL_INCIDENCIAS = "api/incidencias/historico";
const API_URL_MANTENIMIENTO = "api/mantenimientos";
const API_URL_ACTIVOS = "api/activos/numero-serie";

const tbody = document.querySelector(".data-table tbody");
const searchInput = document.getElementById("search");
const searchButton = document.getElementById("search-button");
const areaFilter = document.getElementById("filtro-area");
let areaFilterInicializado = false;

// --- VARIABLES DE PAGINACIÓN ---
let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;

// Obtener datos del backend
const getIncidencias = async () => {
  try {
    const response = await fetch(API_URL_INCIDENCIAS, {
      headers: setAuthHeader()
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) logout();
      throw new Error("❌ No se pudieron obtener las incidencias.");
    }

    const incidencias = await response.json();
    return incidencias.map(incidencia => {
      let fechaSolucion = incidencia.fin_mantenimiento;
      if (fechaSolucion === "0000-00-00" || fechaSolucion === "0000-00-00 00:00:00") {
        fechaSolucion = null;
      }

      return {
        id: incidencia.id,
        itemcode_popup: incidencia.itemcode_popup || null,
        nombre_activo: incidencia.nombre_activo || "Desconocido",
        nombre_area: incidencia.nombre_area || "Sin área",
        nombre_empleado: incidencia.nombre_empleado || "No asignado",
        descripcion: incidencia.descripcion || "Sin descripción",
        fecha_reporte: incidencia.fecha_reporte
          ? incidencia.fecha_reporte.split("T")[0]
          : "No disponible",
        estado_equipo: incidencia.estado_equipo || "verde",
        fin_mantenimiento: fechaSolucion 
      };
    });
  } catch (error) {
    console.error("❌ Error al obtener incidencias:", error);
    return [];
  }
};

// Acciones de mantenimiento
const iniciarMantenimiento = async (incidenciaId, btn) => {
  if (btn) {
      btn.disabled = true;
      btn.textContent = "Iniciando...";
      btn.style.cursor = "wait";
  }

  const fechaActual = new Date().toISOString().split("T")[0];
  try {
    const response = await fetch(`${API_URL_MANTENIMIENTO}/iniciar`, {
      method: "POST",
      headers: setAuthHeader({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        incidencia_id: incidenciaId,
        init_mantenimiento: fechaActual
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Error al iniciar mantenimiento");

    Swal.fire("Iniciado", "El mantenimiento ha comenzado.", "success");
    loadIncidencias(searchInput.value.trim()); 
  } catch (error) {
    console.error("❌ Error al iniciar mantenimiento:", error);
    Swal.fire("Error", "No se pudo iniciar el mantenimiento", "error");
    if (btn) {
        btn.disabled = false;
        btn.textContent = "Iniciar";
        btn.style.cursor = "pointer";
    }
  }
};

// Finalizar mantenimiento
const finalizarMantenimiento = async (incidenciaId, btn) => {
  const result = await Swal.fire({
    title: '¿Se solucionó correctamente el incidente?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#28a745', 
    cancelButtonColor: '#d33',    
    confirmButtonText: 'Si',
    cancelButtonText: 'No'
  });

  if (!result.isConfirmed) return;

  if (btn) {
      btn.disabled = true;
      btn.textContent = "Procesando...";
      btn.style.cursor = "wait";
  }

  const fechaActual = new Date().toISOString().split("T")[0];
  try {
    const response = await fetch(`${API_URL_MANTENIMIENTO}/finalizar`, {
      method: "POST",
      headers: setAuthHeader({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        incidencia_id: incidenciaId,
        fin_mantenimiento: fechaActual
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Error al finalizar mantenimiento");

    Swal.fire("¡Solucionado!", "Incidente cerrado con fecha: " + fechaActual, "success");
    loadIncidencias(searchInput.value.trim()); 
  } catch (error) {
    console.error("❌ Error al finalizar mantenimiento:", error);
    Swal.fire("Error", "Ocurrió un error al finalizar.", "error");
    if (btn) {
        btn.disabled = false;
        btn.textContent = "Solucionar?";
        btn.style.cursor = "pointer";
    }
  }
};

// --- POPUPS ---
const mostrarPopupActivo = async (itemCode) => {
  try {
    const response = await fetch(`${API_URL_ACTIVOS}/${itemCode}`, {
      headers: setAuthHeader()
    });
    if (!response.ok) throw new Error("Activo no encontrado");

    const data = await response.json();
    const precioFormateado = data.Price ? `$${parseFloat(data.Price).toFixed(2)}` : "N/A";

    const infoActivo = `
📌 Código: ${data.ItemCode || "N/A"}
🏷️ Nombre: ${data.ItemName || "N/A"}
🏢 Marca: ${data.marca || "N/A"}
🏷️ Modelo: ${data.modelo || "N/A"}
📅 Fecha Compra: ${data.fecha_compra ? data.fecha_compra.split("T")[0] : "N/A"}
💰 Precio: ${precioFormateado}
💲 Moneda: ${data.Currency || "USD"}
    `.trim();

    Swal.fire({
      title: '📦 Detalle del Activo',
      icon: 'info',
      html: `<pre style="text-align:left; white-space: pre-wrap; font-family: sans-serif;">${infoActivo}</pre>`,
      confirmButtonText: 'Cerrar'
    });
  } catch (error) {
    console.error("❌ Error al mostrar info del activo:", error);
    Swal.fire("Error", "No se pudo obtener información.", "error");
  }
};

const mostrarPopupDescripcion = (textoCompleto) => {
    Swal.fire({
        text: textoCompleto, 
        icon: 'info',
        confirmButtonText: 'Entendido',
    });
};

// --- CARGAR INCIDENCIAS ---
const loadIncidencias = async (filter = "") => {
  if(tbody.innerHTML === "") tbody.innerHTML = "<tr><td colspan='9'>Cargando incidencias...</td></tr>"; 

  const incidencias = await getIncidencias();
  
  const filterTerm = filter.toLowerCase();
  const selectedArea = areaFilter ? areaFilter.value.toLowerCase() : "";
  const estadoFilter = document.getElementById("filtro-estado");
  const selectedEstado = estadoFilter ? estadoFilter.value.toLowerCase() : "";

  const incidenciasFiltradas = incidencias.filter(i =>
    (
      i.nombre_activo.toLowerCase().includes(filterTerm) ||
      i.nombre_empleado.toLowerCase().includes(filterTerm) ||
      i.nombre_area.toLowerCase().includes(filterTerm)
    ) &&
    (!selectedArea || i.nombre_area.toLowerCase() === selectedArea) &&
    (!selectedEstado || i.estado_equipo.toLowerCase() === selectedEstado)
  );

  if (areaFilter && !areaFilterInicializado) {
    const areasUnicas = [...new Set(incidencias.map(i => i.nombre_area).filter(Boolean))];
    areaFilter.innerHTML = `<option value="">Todas las áreas</option>`;
    areasUnicas.forEach(area => {
      const option = document.createElement("option");
      option.value = area;
      option.textContent = area;
      areaFilter.appendChild(option);
    });
    areaFilterInicializado = true;
  }

  totalPages = Math.ceil(incidenciasFiltradas.length / itemsPerPage);
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = incidenciasFiltradas.slice(startIndex, endIndex);

  renderPaginationControls();

  tbody.innerHTML = "";
  if (!paginatedData.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">
        ${filter ? "No se encontraron resultados." : "No hay incidencias."}
    </td></tr>`;
    return;
  }

  paginatedData.forEach(incidencia => {
    
    // Descripción Corta
    const MAX_LENGTH = 150; 
    let descripcionHTML = incidencia.descripcion;
    let esLargo = false;

    if (incidencia.descripcion.length > MAX_LENGTH) {
        esLargo = true;
        descripcionHTML = incidencia.descripcion.substring(0, MAX_LENGTH) + "...";
    }

    const row = document.createElement("tr");
    
    // Fecha Solución
    let celdaFechaSolucion = "<em style='color:#e67e22; font-weight:bold;'>Por solucionar</em>";
    if (incidencia.fin_mantenimiento) {
        const fechaStr = String(incidencia.fin_mantenimiento);
        if (!fechaStr.startsWith("0000") && !fechaStr.startsWith("1899") && !fechaStr.startsWith("1900")) {
            celdaFechaSolucion = fechaStr.split("T")[0];
        }
    }

    // 1. Columnas Base
    row.innerHTML = `
      <td>
        <a href="#" class="activo-link" data-itemcode="${incidencia.itemcode_popup}" style="color:#007bff; font-weight:bold; text-decoration:underline;">
          ${incidencia.nombre_activo}
        </a>
      </td>
      <td>${incidencia.nombre_area}</td>
      <td>${incidencia.nombre_empleado}</td>
      <td>
          ${descripcionHTML}
          ${esLargo ? `<br><a href="#" class="ver-desc-link" style="font-size:12px; color:#007bff;">(Ver más)</a>` : ''}
      </td>
      <td>${incidencia.fecha_reporte}</td>
      <td>${celdaFechaSolucion}</td>
    `;

    // 2. Columna Diagnóstico IA
    const iaCell = document.createElement("td");
    iaCell.style.textAlign = "center"; 

    const btnIA = document.createElement("button");
    btnIA.textContent = "🧠 Diagnóstico"; 
    btnIA.title = "Consultar a la IA";
    btnIA.style.backgroundColor = "#6f42c1"; 
    btnIA.style.color = "white";
    btnIA.style.border = "none";
    btnIA.style.borderRadius = "20px";
    btnIA.style.padding = "5px 12px";
    btnIA.style.cursor = "pointer";
    btnIA.style.fontSize = "12px";
    btnIA.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";

    btnIA.addEventListener("click", async () => {
        Swal.fire({
            title: 'Analizando...',
            text: 'El asistente virtual está revisando el caso...',
            didOpen: () => Swal.showLoading()
        });

        try {
            const response = await fetch("/api/sugerir-solucion", {
                method: "POST",
                headers: setAuthHeader({ "Content-Type": "application/json" }),
                body: JSON.stringify({ 
                    descripcion: incidencia.descripcion,
                    activo_modelo: incidencia.nombre_activo 
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Error al consultar IA");

            let pasosHtml = "<em>Sin pasos específicos.</em>";
            if (data.pasos && Array.isArray(data.pasos)) {
                pasosHtml = `<ul style="text-align: left; margin-top: 5px;">${data.pasos.map(p => `<li>${p}</li>`).join('')}</ul>`;
            }

            Swal.fire({
                title: '🧠 Diagnóstico Sugerido',
                html: `
                    <div style="text-align: left; font-family: sans-serif; font-size: 14px;">
                        <div style="background: #f8f9fa; padding: 10px; border-left: 4px solid #6f42c1; border-radius: 4px; margin-bottom: 10px;">
                            <strong>🩺 Diagnóstico Probable:</strong><br>
                            ${data.diagnostico}
                        </div>
                        <strong>🛠️ Pasos de Solución:</strong>
                        ${pasosHtml}
                        <hr>
                        <div style="margin-top:10px;">
                            <strong>Nivel de Riesgo:</strong> 
                            <span style="font-weight:bold; color: ${data.riesgo === 'alto' ? '#dc3545' : (data.riesgo === 'medio' ? '#fd7e14' : '#28a745')}">
                                ${data.riesgo ? data.riesgo.toUpperCase() : 'DESCONOCIDO'}
                            </span>
                        </div>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#6f42c1',
                width: '600px'
            });

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo obtener el diagnóstico.", "error");
        }
    });
    iaCell.appendChild(btnIA);
    row.appendChild(iaCell);

    // 3. Columna Estado
    const estadoCell = document.createElement("td");
    estadoCell.innerHTML = `<span class="estado-equipo ${incidencia.estado_equipo}">${incidencia.estado_equipo}</span>`;
    row.appendChild(estadoCell);

    // 4. Columna Acciones
    const accionesCell = document.createElement("td");
    
    const iniciarBtn = document.createElement("button");
    iniciarBtn.textContent = "Iniciar";
    iniciarBtn.classList.add("btn-iniciar");

    const finalizarBtn = document.createElement("button");
    finalizarBtn.textContent = "Solucionar?"; 
    finalizarBtn.classList.add("btn-finalizar");

    const finalizadoSpan = document.createElement("span");
    finalizadoSpan.textContent = "✅ Solucionado";
    finalizadoSpan.style.fontWeight = "bold";
    finalizadoSpan.style.color = "green";

    iniciarBtn.style.display = "none";
    finalizarBtn.style.display = "none";
    finalizadoSpan.style.display = "none";

    switch (incidencia.estado_equipo) {
      case "verde":
        finalizadoSpan.style.display = "inline-block";
        break;
      case "amarillo":
        finalizarBtn.style.display = "inline-block";
        break;
      default: 
        iniciarBtn.style.display = "inline-block";
        break;
    }

    iniciarBtn.addEventListener("click", (e) => iniciarMantenimiento(incidencia.id, e.target));
    finalizarBtn.addEventListener("click", (e) => finalizarMantenimiento(incidencia.id, e.target));
    
    accionesCell.appendChild(iniciarBtn);
    accionesCell.appendChild(finalizarBtn);
    accionesCell.appendChild(finalizadoSpan);
    row.appendChild(accionesCell);

    tbody.appendChild(row);

    // Eventos Links
    const linkActivo = row.querySelector(".activo-link");
    if (linkActivo) {
      linkActivo.addEventListener("click", async (e) => {
        e.preventDefault();
        const itemCode = linkActivo.dataset.itemcode;
        if (!itemCode || itemCode === "null") {
          Swal.fire("Info", "Sin detalles disponibles.", "info");
          return;
        }
        await mostrarPopupActivo(itemCode);
      });
    }

    const linkDesc = row.querySelector(".ver-desc-link");
    if (linkDesc) {
        linkDesc.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarPopupDescripcion(incidencia.descripcion);
        });
    }
  });
};

// --- PAGINACIÓN ---
const renderPaginationControls = () => {
    let paginationContainer = document.getElementById("pagination-controls");
    if (!paginationContainer) {
        const table = document.querySelector(".data-table") || document.querySelector("table");
        if (table) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "pagination-controls";
            paginationContainer.className = "pagination-controls"; 
            table.parentNode.insertBefore(paginationContainer, table.nextSibling);
        } else {
            return;
        }
    }

    paginationContainer.innerHTML = "";

    const prevButton = document.createElement("button");
    prevButton.textContent = "⬅ Anterior";
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            loadIncidencias(searchInput.value.trim());
        }
    };

    const pageInfo = document.createElement("span");
    pageInfo.textContent = ` Página ${currentPage} de ${totalPages > 0 ? totalPages : 1} `;

    const nextButton = document.createElement("button");
    nextButton.textContent = "Siguiente ➡";
    nextButton.disabled = currentPage >= totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadIncidencias(searchInput.value.trim());
        }
    };

    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
};

// --- FUNCIONES EXPORTAR (INDIVIDUALES) ---
async function exportarPDFIncidencias() {
  const incidencias = await getIncidencias();
  
  const filter = searchInput.value.trim().toLowerCase();
  const selectedArea = areaFilter ? areaFilter.value.toLowerCase() : "";
  const estadoEl = document.getElementById("filtro-estado");
  const selectedEstado = estadoEl ? estadoEl.value.toLowerCase() : "";

  const filtradas = incidencias.filter(i =>
    (
      i.nombre_activo.toLowerCase().includes(filter) ||
      i.nombre_empleado.toLowerCase().includes(filter) ||
      i.nombre_area.toLowerCase().includes(filter)
    ) &&
    (!selectedArea || i.nombre_area.toLowerCase() === selectedArea) &&
    (!selectedEstado || i.estado_equipo.toLowerCase() === selectedEstado)
  );

  const fechaReporte = new Date().toLocaleString();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte de Incidencias", 14, 20);
  doc.setFontSize(10);
  doc.text(`Fecha del reporte: ${fechaReporte}`, 14, 28);

  const rows = filtradas.map(i => [
    i.nombre_activo,
    i.nombre_area,
    i.nombre_empleado,
    i.descripcion,
    i.fecha_reporte,
    i.fin_mantenimiento || "No solucionado",
    "IA DISPONIBLE", 
    i.estado_equipo
  ]);

  doc.autoTable({
    head: [["Activo", "Área", "Empleado", "Descripción", "Fecha", "Finalización", "Diagnóstico IA", "Estado"]],
    body: rows,
    startY: 35
  });

  doc.save("reporte_incidencias.pdf");
}

async function exportarExcelIncidencias() {
  const incidencias = await getIncidencias();
  const filter = searchInput.value.trim().toLowerCase();
  const selectedArea = areaFilter ? areaFilter.value.toLowerCase() : "";
  const estadoEl = document.getElementById("filtro-estado");
  const selectedEstado = estadoEl ? estadoEl.value.toLowerCase() : "";

  const filtradas = incidencias.filter(i =>
    (
      i.nombre_activo.toLowerCase().includes(filter) ||
      i.nombre_empleado.toLowerCase().includes(filter) ||
      i.nombre_area.toLowerCase().includes(filter)
    ) &&
    (!selectedArea || i.nombre_area.toLowerCase() === selectedArea) &&
    (!selectedEstado || i.estado_equipo.toLowerCase() === selectedEstado)
  );

  const wsData = [
    ["Activo", "Área", "Empleado", "Descripción", "Fecha", "Finalización", "Estado"], 
    ...filtradas.map(i => [
      i.nombre_activo,
      i.nombre_area,
      i.nombre_empleado,
      i.descripcion,
      i.fecha_reporte,
      i.fin_mantenimiento || "No solucionado",
      i.estado_equipo
    ])
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Incidencias");
  XLSX.writeFile(wb, "reporte_incidencias.xlsx");
}

// --- LÓGICA DEL MODAL DE EXPORTACIÓN (VERSIÓN SEGURA) ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Cargar Datos
    loadIncidencias();

    // 2. Filtros y Búsqueda
    if (searchButton) searchButton.addEventListener("click", () => { currentPage = 1; loadIncidencias(searchInput.value.trim()); });
    if (searchInput) searchInput.addEventListener("input", () => { currentPage = 1; loadIncidencias(searchInput.value.trim()); });
    if (areaFilter) areaFilter.addEventListener("change", () => { currentPage = 1; loadIncidencias(searchInput.value.trim()); });
    if (document.getElementById("filtro-estado")) {
        document.getElementById("filtro-estado").addEventListener("change", () => { currentPage = 1; loadIncidencias(searchInput.value.trim()); });
    }

    // 3. Modal de Exportación (Lógica segura sin onclick)
    const exportModal = document.getElementById("exportModal");
    const btnOpen = document.getElementById("btn-exportar-todo");
    const btnClose = document.getElementById("modal-close");
    const btnPdf = document.getElementById("btn-confirm-pdf");
    const btnExcel = document.getElementById("btn-confirm-excel");

    // Abrir
    if (btnOpen) {
        btnOpen.addEventListener("click", () => {
            if (exportModal) exportModal.style.display = "flex";
        });
    }

    // Cerrar
    const cerrarModal = () => { if (exportModal) exportModal.style.display = "none"; };
    if (btnClose) btnClose.addEventListener("click", cerrarModal);
    
    // Cerrar clic fuera
    window.addEventListener("click", (event) => {
        if (event.target === exportModal) cerrarModal();
    });

    // Acción PDF
    if (btnPdf) {
        btnPdf.addEventListener("click", async () => {
            cerrarModal();
            Swal.fire({ title: 'Generando PDF...', didOpen: () => Swal.showLoading() });
            await exportarPDFIncidencias(); 
            Swal.close();
        });
    }

    // Acción Excel
    if (btnExcel) {
        btnExcel.addEventListener("click", async () => {
            cerrarModal();
            Swal.fire({ title: 'Generando Excel...', didOpen: () => Swal.showLoading() });
            await exportarExcelIncidencias(); 
            Swal.close();
        });
    }
});