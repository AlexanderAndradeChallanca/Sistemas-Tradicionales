// ============================================================
// FashionFlow AI - Agente Residente Autonomo
//
// Este modulo actua como un "Agente de IA" que monitorea
// el inventario y genera ordenes de reabastecimiento
// inteligentes cuando detecta stock critico.
//
// Funcionamiento:
// 1. Detecta productos con stockActual <= stockMinimo
// 2. Analiza categoria, talla, precio, y demanda potencial
// 3. Genera una Orden de Compra justificada (JSON)
// 4. Registra la decision en AgentLogs
// ============================================================
const Producto = require('../models/Producto');
const AgentLog = require('../models/AgentLog');

// -------------------------------------------------------
// ANALISIS UNITARIO: Analiza un producto individual
// cuando se detecta stock critico (disparado desde
// productoController al vender o actualizar).
// -------------------------------------------------------
async function analizarProducto(producto) {
    try {
        // 1. Determinar la cantidad optima a pedir segun la categoria
        const cantidadPedido = calcularCantidadOptima(producto);

        // 2. Calcular costo total estimado
        const costoTotal = (parseFloat(producto.precioCompra) * cantidadPedido).toFixed(2);

        // 3. Estimar demanda (simulacion analitica)
        const demandaEstimada = estimarDemanda(producto);

        // 4. Construir la decision (Orden de Compra en JSON)
        const decision = {
            ordenCompra: {
                productoId: producto.id,
                nombre: producto.nombre,
                codigoPrenda: producto.codigoPrenda,
                proveedorSugerido: sugerirProveedor(producto.categoria),
                cantidadPedido,
                costoUnitario: parseFloat(producto.precioCompra),
                costoTotal: parseFloat(costoTotal),
                talla: producto.talla,
                prioridad: producto.stockActual === 0 ? 'URGENTE' : 'ALTA',
                moneda: 'PEN'
            },
            proyeccion: {
                stockActual: producto.stockActual,
                stockMinimo: producto.stockMinimo,
                stockPostReabastecimiento: producto.stockActual + cantidadPedido,
                demandaEstimadaProximaSemana: demandaEstimada,
                "dias estimados para agotar stock": calcularDiasRestantes(producto)
            }
        };

        // 5. Generar justificacion analitica del agente
        const justificacion = generarJustificacion(producto, cantidadPedido, costoTotal, demandaEstimada);

        // 6. Registrar en AgentLogs
        const log = await AgentLog.create({
            productoId: producto.id,
            tipoEvento: producto.stockActual === 0 ? 'STOCK_CRITICO' : 'ALERTA_TEMPRANA',
            decision: JSON.stringify(decision, null, 2),
            justificacion,
            leido: 0
        });

        console.log(`[AGENTE] Orden generada para ${producto.codigoPrenda}: ${cantidadPedido} unidades`);

        return {
            id: log.id,
            productoId: producto.id,
            productoNombre: producto.nombre,
            tipoEvento: log.tipoEvento,
            decision,
            justificacion,
            createdAt: log.createdAt
        };
    } catch (error) {
        console.error(`[AGENTE] Error al analizar producto ${producto.id}:`, error.message);
        return null;
    }
}

// -------------------------------------------------------
// ANALISIS GLOBAL: Escanea todos los productos y genera
// ordenes para los que esten en stock critico.
// Llamado manualmente desde el panel del agente.
// -------------------------------------------------------
async function analizarTodoElInventario() {
    const resultados = [];
    try {
        const productos = await Producto.findAll();
        const criticos = productos.filter(p => p.stockActual <= p.stockMinimo);

        for (const producto of criticos) {
            const resultado = await analizarProducto(producto);
            if (resultado) resultados.push(resultado);
        }

        console.log(`[AGENTE] Escaneo completo: ${resultados.length} ordenes generadas`);
        return resultados;
    } catch (error) {
        console.error('[AGENTE] Error en escaneo global:', error.message);
        throw error;
    }
}

// -------------------------------------------------------
// Funciones analiticas del Agente
// -------------------------------------------------------

function calcularCantidadOptima(producto) {
    const categoria = producto.categoria.toLowerCase();
    const stockActual = producto.stockActual;
    const stockMinimo = producto.stockMinimo;

    // Factor base segun la rotacion de la categoria
    const factores = {
        'polos':        { base: 20, factor: 3.0 },
        'casacas':      { base: 10, factor: 2.5 },
        'pantalones':   { base: 15, factor: 2.5 },
        'shorts':       { base: 12, factor: 2.0 },
        'calzado':      { base: 8,  factor: 2.0 },
        'accesorios':   { base: 15, factor: 3.0 }
    };

    const cfg = factores[categoria] || { base: 10, factor: 2.0 };

    // Formula inteligente: (stockMinimo * factor) - stockActual + base
    let cantidad = Math.round((stockMinimo * cfg.factor) - stockActual + cfg.base);

    // Ajuste por tallas populares (M, L tienen mayor demanda)
    const tallasPopulares = ['m', 'l'];
    if (tallasPopulares.includes(producto.talla.toLowerCase())) {
        cantidad = Math.round(cantidad * 1.3);
    }

    // Ajuste si es talla unica (accesorios)
    if (producto.talla.toUpperCase() === 'UN') {
        cantidad = Math.round(cantidad * 1.5);
    }

    // Garantizar un minimo sensato
    return Math.max(cantidad, stockMinimo * 2);
}

function estimarDemanda(producto) {
    const demandaBase = {
        'polos': 15,
        'casacas': 8,
        'pantalones': 10,
        'shorts': 6,
        'calzado': 5,
        'accesorios': 12
    };
    const base = demandaBase[producto.categoria.toLowerCase()] || 8;
    const factorTalla = (producto.talla.toLowerCase() === 'm' || producto.talla.toLowerCase() === 'l') ? 1.4 : 1.0;
    return Math.round(base * factorTalla);
}

function sugerirProveedor(categoria) {
    const proveedores = {
        'polos': 'Textiles Deportivos S.A.C.',
        'casacas': 'Outdoor Fashion Import E.I.R.L.',
        'pantalones': 'SportWear Group S.A.',
        'shorts': 'ActiveLife Distribuciones',
        'calzado': 'Importadora Nike/Adidas S.A.C.',
        'accesorios': 'SportAccessories E.I.R.L.'
    };
    return proveedores[categoria] || 'Proveedor Generico S.A.C.';
}

function calcularDiasRestantes(producto) {
    if (producto.stockActual <= 0) return 0;
    const consumoDiarioEstimado = {
        'polos': 3,
        'casacas': 1.5,
        'pantalones': 2,
        'shorts': 1,
        'calzado': 1,
        'accesorios': 2.5
    };
    const consumo = consumoDiarioEstimado[producto.categoria.toLowerCase()] || 1.5;
    return Math.round(producto.stockActual / consumo);
}

function generarJustificacion(producto, cantidadPedido, costoTotal, demandaEstimada) {
    const dias = calcularDiasRestantes(producto);
    const estado = producto.stockActual === 0 ? 'SIN STOCK' : 'CRITICO';

    return (
        `ANALISIS DEL AGENTE RESIDENTE:\n` +
        `El producto "${producto.nombre}" (${producto.codigoPrenda}) se encuentra en estado ${estado}. ` +
        `Stock actual: ${producto.stockActual} unidades. Stock minimo: ${producto.stockMinimo}. ` +
        `Talla: ${producto.talla}. Categoria: ${producto.categoria}.\n\n` +
        `Se estima que el stock se agotara en aproximadamente ${dias} dias. ` +
        `La demanda semanal proyectada para esta categoria/talla es de ${demandaEstimada} unidades.\n\n` +
        `DECISION: Se genera una orden de compra por ${cantidadPedido} unidades ` +
        `(costo total: S/ ${costoTotal}). ` +
        `Cantidad calculada segun: (stockMinimo x factorCategoria) - stockActual + base, ` +
        `con ajuste por popularidad de talla y rotacion historica.\n\n` +
        `Proveedor sugerido: ${sugerirProveedor(producto.categoria)}. ` +
        `Se recomienda prioridad ${producto.stockActual === 0 ? 'URGENTE' : 'ALTA'} para evitar quiebre de stock.`
    );
}

// -------------------------------------------------------
// Obtener logs del agente
// -------------------------------------------------------
async function obtenerDecisiones() {
    try {
        const logs = await AgentLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        // Parsear el JSON de la decision para el frontend
        return logs.map(log => ({
            id: log.id,
            productoId: log.productoId,
            tipoEvento: log.tipoEvento,
            decision: JSON.parse(log.decision),
            justificacion: log.justificacion,
            leido: log.leido,
            createdAt: log.createdAt
        }));
    } catch (error) {
        console.error('[AGENTE] Error al obtener decisiones:', error.message);
        throw error;
    }
}

// -------------------------------------------------------
// Marcar decision como leida
// -------------------------------------------------------
async function marcarComoLeido(id) {
    try {
        const log = await AgentLog.findByPk(id);
        if (!log) return null;
        log.leido = 1;
        await log.save();
        return { mensaje: 'Decision marcada como leida' };
    } catch (error) {
        throw error;
    }
}

// -------------------------------------------------------
// Contar decisiones no leidas
// -------------------------------------------------------
async function contarNoLeidas() {
    try {
        return await AgentLog.count({ where: { leido: 0 } });
    } catch (error) {
        throw error;
    }
}

module.exports = {
    analizarProducto,
    analizarTodoElInventario,
    obtenerDecisiones,
    marcarComoLeido,
    contarNoLeidas
};
