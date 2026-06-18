// ============================================================
// FashionFlow AI - Punto de entrada del servidor Express
// Inicializa BD, sincroniza modelos, expone API en puerto 3000
// ============================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('../config/database');
const apiRoutes = require('../routes/api');

try {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch (e) {
    console.warn('[SERVER] Archivo .env no encontrado, usando variables del sistema.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas
app.use('/api', apiRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        estado: 'OK',
        servicio: 'FashionFlow AI',
        version: '2.0.0',
        agente: 'Residente Activo'
    });
});

// Inicializacion
const startServer = async () => {
    console.log('[SERVER] Iniciando FashionFlow AI...');
    console.log('[SERVER] Verificando conexion a base de datos...');

    await testConnection();

    // Sincronizar modelos (sin alterar estructura existente)
    const Producto = require('../models/Producto');
    const AgentLog = require('../models/AgentLog');
    await Producto.sync({ alter: false });
    await AgentLog.sync({ alter: false });

    app.listen(PORT, () => {
        console.log('============================================');
        console.log(`  FashionFlow AI Agent API`);
        console.log(`  Puerto: ${PORT}`);
        console.log(`  Endpoints:`);
        console.log(`    Productos: /api/productos`);
        console.log(`    Agente:    /api/agente/...`);
        console.log(`    Health:    /api/health`);
        console.log('============================================');
    });
};

startServer().catch((error) => {
    console.error('[SERVER] Error fatal:', error.message);
    process.exit(1);
});

module.exports = app;
