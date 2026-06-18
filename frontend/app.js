// ============================================================
// FashionFlow AI - Logica del Frontend
// Catalogo de productos + Panel de Decisiones del Agente
// Consume API en localhost:3000 via Fetch
// ============================================================

const API_URL = "http://localhost:3000/api";

// ============================================================
// INICIALIZACION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarDecisiones();
    // Auto-refresh del panel del agente cada 15 segundos
    setInterval(() => {
        cargarDecisiones(true);
    }, 15000);
});

// ============================================================
// PRODUCTOS
// ============================================================

async function cargarProductos() {
    const tbody = document.getElementById('tbodyProductos');
    tbody.innerHTML = '<tr><td colspan="9" class="text-center">Cargando productos...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/productos`);
        if (!res.ok) throw new Error('Error al obtener productos');
        const productos = await res.json();
        renderizarProductos(productos);
        actualizarStockInfo(productos);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="color:#dc3545;">
            Error al cargar productos. Verifica que el backend este corriendo en ${API_URL}
        </td></tr>`;
    }
}

function renderizarProductos(productos) {
    const tbody = document.getElementById('tbodyProductos');

    if (!productos.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay productos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map(p => {
        const esCritico = p.stockActual <= p.stockMinimo;
        const esBajo = p.stockActual <= p.stockMinimo + 5 && !esCritico;
        let stockClass = 'stock-normal';
        let etiquetaStock = 'Disponible';
        if (esCritico) {
            stockClass = 'stock-critico';
            etiquetaStock = `<span class="badge-critico">Stock Critico</span>`;
        } else if (esBajo) {
            stockClass = 'stock-bajo';
            etiquetaStock = 'Stock Bajo';
        }

        const img = p.imagenUrl || 'https://via.placeholder.com/300x400?text=Sin+Imagen';

        return `
            <tr class="${esCritico ? 'fila-critica' : ''}">
                <td><img src="${img}" alt="${p.nombre}" class="producto-img" onerror="this.src='https://via.placeholder.com/300x400?text=Error'"></td>
                <td><strong>${p.codigoPrenda}</strong></td>
                <td>${p.nombre}</td>
                <td>${p.categoria}</td>
                <td>${p.talla}</td>
                <td>
                    <span class="${stockClass}">${p.stockActual}</span>
                    <small style="color:#aaa;"> / ${p.stockMinimo}</small>
                </td>
                <td><strong>S/ ${parseFloat(p.precioVenta).toFixed(2)}</strong></td>
                <td>${etiquetaStock}</td>
                <td>
                    <div class="acciones">
                        <button class="btn btn-sm btn-primary" onclick="editarProducto(${p.id})">Editar</button>
                        <button class="btn btn-sm btn-success" onclick="simularVenta(${p.id})">Vender</button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${p.id})">Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function actualizarStockInfo(productos) {
    const total = productos.length;
    const criticos = productos.filter(p => p.stockActual <= p.stockMinimo).length;
    const span = document.getElementById('stockInfo');
    if (criticos > 0) {
        span.innerHTML = `<span style="color:#dc3545;">&#x26A0;</span> ${criticos} de ${total} en stock critico`;
        span.style.color = '#dc3545';
    } else {
        span.textContent = `${total} productos - Todo en orden`;
        span.style.color = '#198754';
    }
}

// ============================================================
// FORMULARIO PRODUCTO (Crear / Editar)
// ============================================================

function abrirFormulario() {
    document.getElementById('modalTitle').textContent = 'Nuevo Producto';
    document.getElementById('productoForm').reset();
    document.getElementById('productoId').value = '';
    document.getElementById('btnGuardar').textContent = 'Guardar';
    document.getElementById('modalOverlay').classList.add('active');
}

function cerrarFormulario() {
    document.getElementById('modalOverlay').classList.remove('active');
}

document.getElementById('productoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('productoId').value;
    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        codigoPrenda: document.getElementById('codigoPrenda').value.trim(),
        categoria: document.getElementById('categoria').value,
        talla: document.getElementById('talla').value,
        stockActual: parseInt(document.getElementById('stockActual').value) || 0,
        stockMinimo: parseInt(document.getElementById('stockMinimo').value) || 5,
        precioCompra: parseFloat(document.getElementById('precioCompra').value) || 0,
        precioVenta: parseFloat(document.getElementById('precioVenta').value) || 0,
        imagenUrl: document.getElementById('imagenUrl').value.trim() || null
    };

    try {
        let res;
        if (id) {
            res = await fetch(`${API_URL}/productos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        } else {
            res = await fetch(`${API_URL}/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        }

        const result = await res.json();

        if (!res.ok) {
            const msg = result.errores ? result.errores.join(', ') : result.mensaje;
            throw new Error(msg);
        }

        cerrarFormulario();
        await cargarProductos();
        await cargarDecisiones();
        mostrarToast(result.mensaje || 'Operacion exitosa', 'success');

        // Si el agente genero una decision, mostrarlo
        if (result.decisionAgente) {
            mostrarToast('El agente genero una orden de reabastecimiento', 'warning');
        }
    } catch (error) {
        mostrarToast('Error: ' + error.message, 'error');
    }
});

// ============================================================
// ACCIONES SOBRE PRODUCTOS
// ============================================================

async function editarProducto(id) {
    try {
        const res = await fetch(`${API_URL}/productos/${id}`);
        if (!res.ok) throw new Error('Producto no encontrado');
        const p = await res.json();

        document.getElementById('modalTitle').textContent = 'Editar Producto';
        document.getElementById('productoId').value = p.id;
        document.getElementById('nombre').value = p.nombre;
        document.getElementById('codigoPrenda').value = p.codigoPrenda;
        document.getElementById('categoria').value = p.categoria;
        document.getElementById('talla').value = p.talla;
        document.getElementById('stockActual').value = p.stockActual;
        document.getElementById('stockMinimo').value = p.stockMinimo;
        document.getElementById('precioCompra').value = p.precioCompra;
        document.getElementById('precioVenta').value = p.precioVenta;
        document.getElementById('imagenUrl').value = p.imagenUrl || '';
        document.getElementById('btnGuardar').textContent = 'Actualizar';
        document.getElementById('modalOverlay').classList.add('active');
    } catch (error) {
        mostrarToast('Error al cargar producto: ' + error.message, 'error');
    }
}

async function simularVenta(id) {
    if (!confirm('Vender 1 unidad de este producto?\n\nEl agente analizara automaticamente si queda en stock critico.')) return;

    try {
        const res = await fetch(`${API_URL}/productos/${id}/vender`, { method: 'PUT' });
        const result = await res.json();

        if (!res.ok) throw new Error(result.mensaje);

        await cargarProductos();
        await cargarDecisiones();

        // Mostrar alerta si existe
        if (result.alerta) {
            mostrarToast(result.alerta, 'warning');
        } else {
            mostrarToast(result.mensaje, 'success');
        }

        // Si el agente genero una decision, notificar
        if (result.decisionAgente) {
            mostrarToast(
                `IA: Orden generada para "${result.decisionAgente.productoNombre}"`,
                'info'
            );
        }
    } catch (error) {
        mostrarToast('Error: ' + error.message, 'error');
    }
}

async function eliminarProducto(id) {
    if (!confirm('Esta seguro de eliminar este producto?')) return;

    try {
        const res = await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (!res.ok) throw new Error(result.mensaje);

        await cargarProductos();
        mostrarToast(result.mensaje, 'success');
    } catch (error) {
        mostrarToast('Error: ' + error.message, 'error');
    }
}

// ============================================================
// PANEL DE DECISIONES DEL AGENTE AUTONOMO
// ============================================================

async function cargarDecisiones(silencioso = false) {
    try {
        const [decRes, countRes] = await Promise.all([
            fetch(`${API_URL}/agente/decisiones`),
            fetch(`${API_URL}/agente/no-leidas`)
        ]);

        if (!decRes.ok) throw new Error('Error al cargar decisiones');

        const decisiones = await decRes.json();
        const countData = await countRes.json();

        renderizarDecisiones(decisiones);
        actualizarBadgeNotificaciones(countData.noLeidas);
    } catch (error) {
        if (!silencioso) {
            console.error('Error al cargar decisiones del agente:', error);
        }
    }
}

function renderizarDecisiones(decisiones) {
    const container = document.getElementById('agentDecisions');
    const badge = document.getElementById('panelBadge');

    if (!decisiones.length) {
        container.innerHTML = '<p class="text-center" style="color:#999; padding:20px 0;">Aun no hay decisiones del agente. Simula una venta para activarlo.</p>';
        badge.textContent = '0 decisiones';
        return;
    }

    badge.textContent = `${decisiones.length} decision(es)`;

    container.innerHTML = decisiones.map(d => {
        const esNoLeido = d.leido === 0;
        const tipoClass = d.tipoEvento.toLowerCase().replace('_', '-');
        const orden = d.decision?.ordenCompra || {};
        const proy = d.decision?.proyeccion || {};

        return `
            <div class="decision-card ${esNoLeido ? 'no-leido' : 'leido'}">
                <div class="dc-header">
                    <span class="dc-tipo ${tipoClass}">${d.tipoEvento}</span>
                    <span class="dc-fecha">${formatearFecha(d.createdAt)}</span>
                </div>
                <div class="dc-producto">${orden.nombre || 'Producto #' + d.productoId}</div>
                <div class="dc-resumen">
                    <span>Codigo: ${orden.codigoPrenda || '-'}</span>
                    <span>Talla: ${orden.talla || '-'}</span>
                    <span>Pedido: <strong>${orden.cantidadPedido || 0}</strong> uni.</span>
                    <span>Costo: S/ ${(orden.costoTotal || 0).toFixed(2)}</span>
                    <span>Prioridad: <strong>${orden.prioridad || '-'}</strong></span>
                </div>
                <div class="dc-resumen" style="margin-top:0;">
                    <span>Stock actual: ${proy.stockActual || 0}</span>
                    <span>Stock post-reabastecimiento: ${proy.stockPostReabastecimiento || 0}</span>
                    <span>Demanda estimada: ${proy.demandaEstimadaProximaSemana || 0}/sem</span>
                </div>
                <div class="dc-acciones">
                    <button class="btn btn-sm btn-primary" onclick="verDetalleDecision(${d.id})">Ver detalle</button>
                    ${esNoLeido ? `<button class="btn btn-sm btn-secondary" onclick="marcarLeida(${d.id})">Marcar leida</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function actualizarBadgeNotificaciones(noLeidas) {
    const badge = document.getElementById('notifBadge');
    badge.textContent = noLeidas;
    badge.style.display = noLeidas > 0 ? 'inline' : 'none';
}

// ============================================================
// ACCIONES DEL AGENTE
// ============================================================

async function ejecutarEscaneoAgente() {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Escaneando...';

    try {
        const res = await fetch(`${API_URL}/agente/escanear`, { method: 'POST' });
        const result = await res.json();

        if (!res.ok) throw new Error(result.mensaje);

        await cargarDecisiones();
        await cargarProductos();

        mostrarToast(
            result.ordenes.length > 0
                ? `Agente: ${result.ordenes.length} orden(es) de reabastecimiento generada(s)`
                : 'Escaneo completado. No se detectaron productos en stock critico.',
            result.ordenes.length > 0 ? 'warning' : 'success'
        );
    } catch (error) {
        mostrarToast('Error del agente: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '\u{1F916} Escanear Inventario';
    }
}

async function marcarLeida(id) {
    try {
        const res = await fetch(`${API_URL}/agente/decisiones/${id}/leer`, { method: 'PUT' });
        if (!res.ok) throw new Error('Error al marcar como leida');
        await cargarDecisiones();
    } catch (error) {
        mostrarToast('Error: ' + error.message, 'error');
    }
}

// ============================================================
// MODAL DETALLE DE DECISION
// ============================================================

async function verDetalleDecision(id) {
    try {
        const res = await fetch(`${API_URL}/agente/decisiones`);
        const decisiones = await res.json();
        const d = decisiones.find(dc => dc.id === id);
        if (!d) throw new Error('Decision no encontrada');

        const orden = d.decision?.ordenCompra || {};
        const proy = d.decision?.proyeccion || {};

        document.getElementById('decisionModalTitle').textContent =
            `Decision del Agente - ${d.tipoEvento}`;

        document.getElementById('decisionModalBody').innerHTML = `
            <div class="decision-detalle">
                <div class="dd-seccion">
                    <h3>Orden de Compra Generada</h3>
                    <div class="dd-grid">
                        <div class="item"><span class="label">Producto</span><span class="value">${orden.nombre || '-'}</span></div>
                        <div class="item"><span class="label">Codigo</span><span class="value">${orden.codigoPrenda || '-'}</span></div>
                        <div class="item"><span class="label">Cantidad</span><span class="value">${orden.cantidadPedido || 0} unidades</span></div>
                        <div class="item"><span class="label">Talla</span><span class="value">${orden.talla || '-'}</span></div>
                        <div class="item"><span class="label">Costo unitario</span><span class="value">S/ ${(orden.costoUnitario || 0).toFixed(2)}</span></div>
                        <div class="item"><span class="label">Costo total</span><span class="value">S/ ${(orden.costoTotal || 0).toFixed(2)}</span></div>
                        <div class="item"><span class="label">Proveedor</span><span class="value">${orden.proveedorSugerido || '-'}</span></div>
                        <div class="item"><span class="label">Prioridad</span><span class="value">${orden.prioridad || '-'}</span></div>
                    </div>
                </div>

                <div class="dd-seccion">
                    <h3>Proyeccion</h3>
                    <div class="dd-grid">
                        <div class="item"><span class="label">Stock actual</span><span class="value">${proy.stockActual || 0}</span></div>
                        <div class="item"><span class="label">Stock minimo</span><span class="value">${proy.stockMinimo || 0}</span></div>
                        <div class="item"><span class="label">Stock post-reabastecimiento</span><span class="value">${proy.stockPostReabastecimiento || 0}</span></div>
                        <div class="item"><span class="label">Demanda estimada (semanal)</span><span class="value">${proy.demandaEstimadaProximaSemana || 0} uni.</span></div>
                        <div class="item"><span class="label">Dias hasta agotar stock</span><span class="value">${proy['dias_estimados_para_agotar_stock'] || 0} dias</span></div>
                    </div>
                </div>

                <div class="dd-seccion">
                    <h3>Justificacion del Agente</h3>
                    <div class="dd-justificacion">${d.justificacion || 'Sin justificacion disponible.'}</div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-primary" onclick="marcarLeida(${d.id}); cerrarModalDecision();">Marcar como leida</button>
                    <button class="btn btn-cancel" onclick="cerrarModalDecision()">Cerrar</button>
                </div>
            </div>
        `;

        document.getElementById('modalDecision').classList.add('active');
    } catch (error) {
        mostrarToast('Error al cargar detalle: ' + error.message, 'error');
    }
}

function cerrarModalDecision() {
    document.getElementById('modalDecision').classList.remove('active');
}

// ============================================================
// UTILIDADES
// ============================================================

function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const d = new Date(fechaISO);
    return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.className = `toast ${tipo} show`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 4500);
}
