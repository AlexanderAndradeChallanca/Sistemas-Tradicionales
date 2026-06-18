// ============================================================
// FashionFlow AI - Rutas Integradas de la API
// Endpoints: Productos + Agente Autonomo
// ============================================================
const { Router } = require('express');
const router = Router();

const productoController = require('../controllers/productoController');
const agentController = require('../controllers/agentController');

// ---- PRODUCTOS ----
router.get('/productos', productoController.listar);
router.get('/productos/:id', productoController.obtenerPorId);
router.post('/productos', productoController.crear);
router.put('/productos/:id', productoController.actualizar);
router.put('/productos/:id/vender', productoController.simularVenta);
router.delete('/productos/:id', productoController.eliminar);

// ---- AGENTE AUTONOMO ----
router.get('/agente/decisiones', async (req, res) => {
    try {
        const decisiones = await agentController.obtenerDecisiones();
        res.json(decisiones);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener decisiones del agente', error: error.message });
    }
});

router.get('/agente/no-leidas', async (req, res) => {
    try {
        const count = await agentController.contarNoLeidas();
        res.json({ noLeidas: count });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al contar decisiones', error: error.message });
    }
});

router.put('/agente/decisiones/:id/leer', async (req, res) => {
    try {
        const resultado = await agentController.marcarComoLeido(req.params.id);
        if (!resultado) return res.status(404).json({ mensaje: 'Decision no encontrada' });
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al marcar decision', error: error.message });
    }
});

router.post('/agente/escanear', async (req, res) => {
    try {
        const resultados = await agentController.analizarTodoElInventario();
        res.json({
            mensaje: `Escaneo completado: ${resultados.length} orden(es) generada(s)`,
            ordenes: resultados
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al ejecutar escaneo del agente', error: error.message });
    }
});

module.exports = router;
