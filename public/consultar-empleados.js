const API_URL = "api/empleados";
const API_URL_AREAS = "api/areas";

let empleados = []; 
let empleadosFiltrados = []; 
let listaAreas = []; 

// --- VARIABLES DE PAGINACIÓN ---
let currentPage = 1;
const itemsPerPage = 10;
let totalPages = 1;

function eliminarDuplicados(lista) {
  const mapa = new Map();
  lista.forEach(emp => {
    if (!mapa.has(emp.id)) {
      mapa.set(emp.id, emp);
    }
  });
  return Array.from(mapa.values());
}

// 1. Cargar Áreas primero
async function cargarAreas() {
    try {
        const res = await fetch(API_URL_AREAS);
        if(res.ok) {
            listaAreas = await res.json();
            console.log("Áreas cargadas:", listaAreas);
        }
    } catch (error) {
        console.error("Error cargando áreas:", error);
    }
}

// 2. Cargar empleados
async function cargarEmpleados() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error en la respuesta del servidor");
    
    const data = await res.json();
    empleados = eliminarDuplicados(data);
    empleadosFiltrados = [...empleados]; 
    mostrarEmpleados(); 

  } catch (err) {
    console.error(err);
  }
}

function mostrarEmpleados(lista = empleadosFiltrados) {
  empleadosFiltrados = lista;
  const tbody = document.getElementById("tabla-empleados");
  tbody.innerHTML = "";

  totalPages = Math.ceil(empleadosFiltrados.length / itemsPerPage);

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = empleadosFiltrados.slice(startIndex, endIndex);

  if (paginatedData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No se encontraron empleados.</td></tr>`;
      renderPaginationControls();
      return;
  }

  paginatedData.forEach(emp => {
    const tr = document.createElement("tr");
    const fecha = emp.fecha_ingreso ? emp.fecha_ingreso.split("T")[0] : "";
    
    // Buscar ID del área basado en el nombre (Tu lógica actual)
    const nombreArea = emp.area || emp.nombre_area || "Sin Área"; 
    const areaObj = listaAreas.find(a => a.nombre === nombreArea);
    const areaIdEncontrado = areaObj ? areaObj.id : "";

    // 1. Crear celdas de forma segura
    const tdId = document.createElement('td');
    tdId.textContent = emp.id;
    
    const tdCodigo = document.createElement('td');
    tdCodigo.textContent = emp.codigo || "N/A";
    
    // ✅ AQUÍ ESTÁ LA PROTECCIÓN: textContent ignora etiquetas HTML maliciosas
    const tdNombre = document.createElement('td');
    tdNombre.textContent = emp.nombre; 
    
    const tdCorreo = document.createElement('td');
    tdCorreo.textContent = emp.correo || "";
    
    const tdArea = document.createElement('td');
    tdArea.textContent = nombreArea;
    tdArea.setAttribute("data-area-id", areaIdEncontrado); // Guardamos el ID para editar
    
    const tdFecha = document.createElement('td');
    tdFecha.textContent = fecha || "";

    // 2. Botones (HTML estático seguro)
    const tdAcciones = document.createElement('td');
    tdAcciones.innerHTML = `
        <button type="button" class="btn-editar">Modificar</button>
        <button type="button" class="btn-guardar" style="display:none;">Guardar</button>
    `;

    // 3. Ensamblar fila
    tr.appendChild(tdId);
    tr.appendChild(tdCodigo);
    tr.appendChild(tdNombre);
    tr.appendChild(tdCorreo);
    tr.appendChild(tdArea);
    tr.appendChild(tdFecha);
    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
  });

  renderPaginationControls();
}
function renderPaginationControls() {
    let paginationContainer = document.getElementById("pagination-controls");
    if (!paginationContainer) {
        const table = document.querySelector(".data-table") || document.querySelector("table");
        if (table) {
            paginationContainer = document.createElement("div");
            paginationContainer.id = "pagination-controls";
            paginationContainer.className = "pagination-controls"; 
            table.parentNode.insertBefore(paginationContainer, table.nextSibling);
        } else { return; }
    }

    paginationContainer.innerHTML = "";
    const prevButton = document.createElement("button");
    prevButton.textContent = "⬅ Anterior";
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            mostrarEmpleados(empleadosFiltrados);
        }
    };
    const pageInfo = document.createElement("span");
    pageInfo.textContent = ` Página ${currentPage} de ${totalPages || 1} `;
    const nextButton = document.createElement("button");
    nextButton.textContent = "Siguiente ➡";
    nextButton.disabled = currentPage >= totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            mostrarEmpleados(empleadosFiltrados);
        }
    };
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageInfo);
    paginationContainer.appendChild(nextButton);
}

// Función Editar
function activarEdicion(btn) {
  const fila = btn.closest("tr");
  const celdas = fila.children;
  const btnGuardar = fila.querySelector(".btn-guardar");

  btn.style.display = "none";
  if(btnGuardar) btnGuardar.style.display = "inline-block";

  // Índices: 0=ID, 1=Codigo, 2=Nombre, 3=Correo, 4=Area, 5=Fecha, 6=Acciones
  const nombreActual = celdas[2].innerText;
  const correoActual = celdas[3].innerText;
  const areaActualId = celdas[4].getAttribute("data-area-id"); // Recuperamos el ID que buscamos antes
  const fechaActual = celdas[5].innerText;

  celdas[2].innerHTML = `<input type="text" class="input-edit" value="${nombreActual}" />`;
  celdas[3].innerHTML = `<input type="email" class="input-edit" value="${correoActual}" />`;
  
  // Construir Select de Área
  let opcionesArea = '<option value="">Seleccione Área</option>';
  listaAreas.forEach(area => {
      // Comparamos IDs para pre-seleccionar
      const selected = (String(area.id) === String(areaActualId)) ? 'selected' : '';
      opcionesArea += `<option value="${area.id}" ${selected}>${area.nombre}</option>`;
  });
  celdas[4].innerHTML = `<select class="input-edit">${opcionesArea}</select>`;

  celdas[5].innerHTML = `<input type="date" class="input-edit" value="${fechaActual}" />`;
}

// Función Guardar
async function guardarCambios(btn) {
  const fila = btn.closest("tr");
  const celdas = fila.children;
  const id = celdas[0].textContent.trim();
  
  const inputNombre = celdas[2].querySelector("input");
  const inputCorreo = celdas[3].querySelector("input");
  const inputArea = celdas[4].querySelector("select");
  const inputFecha = celdas[5].querySelector("input");

  if (!inputNombre || !inputCorreo || !inputArea || !inputFecha) {
    Swal.fire({ icon: "error", text: "Error: Campos no encontrados." });
    return;
  }

  const nombre = inputNombre.value?.trim()?.toUpperCase();
  const correo = inputCorreo.value?.trim()?.toLowerCase();
  const area_id = inputArea.value;
  const fecha_ingreso = inputFecha.value;

  if (!nombre || !correo || !fecha_ingreso || !area_id) {
    Swal.fire({ icon: "warning", text: "Todos los campos son obligatorios." });
    return;
  }

  const datos = { nombre, correo, fecha_ingreso, area_id };

  try {
    const result = await Swal.fire({
      title: "¿Guardar cambios?",
      text: "Se actualizará la información del empleado y su área.",
      icon: "question",
      showDenyButton: true,
      confirmButtonText: "Guardar",
      denyButtonText: "Cancelar"
    });

    if (result.isDenied) {
        mostrarEmpleados();
        return;
    }

    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });

    if (!res.ok) {
      throw new Error("Error al actualizar.");
    }

    await Swal.fire({
      icon: "success",
      text: "✅ Empleado actualizado.",
      showConfirmButton: false,
      timer: 1500
    });

    cargarEmpleados(); 

  } catch (err) {
    console.error("❌ Error:", err.message);
    Swal.fire({ icon: "error", text: "Error al guardar los cambios." });
  }
}

// EXPORTACIÓN (Sin cambios funcionales, solo se asegura que funcione)
async function exportarEmpleadosPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Reporte de Empleados", 14, 20);
        const fechaReporte = new Date().toLocaleString();
        doc.setFontSize(10);
        doc.text(`Fecha del reporte: ${fechaReporte}`, 14, 28);
        const dataToExport = empleadosFiltrados; 
        const rows = dataToExport.map(emp => [
            emp.codigo || "N/A",
            emp.nombre || "No especificado",
            emp.correo || "No disponible",
            emp.area || "Sin Área",
            emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toLocaleDateString() : "No disponible"
        ]);
        doc.autoTable({
          head: [["Código", "Nombre", "Correo", "Área", "Fecha de Ingreso"]],
          body: rows,
          startY: 35
        });
        doc.save("reporte_empleados.pdf");
      } catch (error) { console.error("Error PDF:", error); }
}

function exportarEmpleadosExcel() {
    try {
        const dataToExport = empleadosFiltrados;
        const wsData = [
          ["Código", "Nombre", "Correo", "Área", "Fecha de Ingreso"],
          ...dataToExport.map(emp => [
            emp.codigo || "N/A",
            emp.nombre || "No especificado",
            emp.correo || "No disponible",
            emp.area || "Sin Área",
            emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toLocaleDateString() : "No disponible"
          ])
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Empleados");
        XLSX.writeFile(wb, "reporte_empleados.xlsx");
      } catch (error) { console.error("Error Excel:", error); }
}

async function exportarTodo() {
  await exportarEmpleadosPDF();
  exportarEmpleadosExcel();
}

document.addEventListener("DOMContentLoaded", async () => {
  await cargarAreas();
  cargarEmpleados();

  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", () => {
        const texto = buscador.value.toLowerCase();
        const filtrados = empleados.filter(e => {
            return Object.values(e).some(val =>
            val && val.toString().toLowerCase().includes(texto)
            );
        });
        currentPage = 1;
        mostrarEmpleados(filtrados);
    });
  }

  const btnExportar = document.getElementById("btn-exportar-todo");
  if (btnExportar) btnExportar.addEventListener("click", exportarTodo);

  const tablaEmpleados = document.getElementById("tabla-empleados");
  tablaEmpleados.addEventListener("click", (e) => {
    const target = e.target; 
    if (target.classList.contains("btn-editar")) activarEdicion(target);
    if (target.classList.contains("btn-guardar")) guardarCambios(target);
  });
});