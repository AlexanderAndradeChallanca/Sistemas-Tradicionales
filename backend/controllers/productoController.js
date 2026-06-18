// ============================================================
// FashionFlow AI - Controlador de Productos
// CRUD tradicional + simulacion de venta con disparo agente
// ============================================================
const Producto = require('../models/Producto');
const agentController = require('./agentController');

// GET /api/productos
exports.listar = async (req, res) => {
    try {
        const productos = await Producto.findAll({ order: [['id', 'DESC']] });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar productos', error: error.message });
    }
};

// GET /api/productos/:id
exports.obtenerPorId = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener producto', error: error.message });
    }
};

// POST /api/productos
exports.crear = async (req, res) => {
    try {
        const nuevo = await Producto.create(req.body);
        res.status(201).json({ mensaje: 'Producto creado exitosamente', producto: nuevo });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError')
            return res.status(400).json({ mensaje: 'El codigo de prenda ya existe' });
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ mensaje: 'Error de validacion', errores: mensajes });
        }
        res.status(500).json({ mensaje: 'Error al crear producto', error: error.message });
    }
};

// PUT /api/productos/:id
exports.actualizar = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

        await producto.update(req.body);

        // Disparar agente si el producto quedo en stock critico despues de actualizar
        let decisionAgente = null;
        if (producto.stockActual <= producto.stockMinimo) {
            decisionAgente = await agentController.analizarProducto(producto);
        }

        res.json({ mensaje: 'Producto actualizado', producto, decisionAgente });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError')
            return res.status(400).json({ mensaje: 'El codigo de prenda ya existe' });
        if (error.name === 'SequelizeValidationError') {
            const mensajes = error.errors.map(e => e.message);
            return res.status(400).json({ mensaje: 'Error de validacion', errores: mensajes });
        }
        res.status(500).json({ mensaje: 'Error al actualizar producto', error: error.message });
    }
};

// PUT /api/productos/:id/vender (Simular venta: resta 1 al stock)
exports.simularVenta = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });
        if (producto.stockActual <= 0)
            return res.status(400).json({ mensaje: 'No hay stock disponible para vender' });

        producto.stockActual -= 1;
        await producto.save();

        let alerta = null;
        let decisionAgente = null;

        // === DISPARO AGENTE AUTONOMO ===
        if (producto.stockActual <= producto.stockMinimo) {
            alerta = `Stock critico: Quedan ${producto.stockActual} unidades de "${producto.nombre}"`;
            decisionAgente = await agentController.analizarProducto(producto);
        }

        res.json({
            mensaje: 'Venta simulada exitosamente',
            producto,
            alerta,
            decisionAgente
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al simular venta', error: error.message });
    }
};

// DELETE /api/productos/:id
exports.eliminar = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

        await producto.destroy();
        res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar producto', error: error.message });
    }
};
