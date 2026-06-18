// ============================================================
// FashionFlow AI - Conexion a SQL Server via Sequelize
// Lee credenciales de variables de entorno (process.env)
// Compatible con Somee (encrypt: true)
// ============================================================
// FORZAR LA CARGA DE VARIABLES DE ENTORNO DESDE LA RAÍZ DEL BACKEND
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 1433,
        dialect: 'mssql',
        dialectOptions: {
            encrypt: true,
            trustServerCertificate: true,
            connectTimeout: 30000,
            requestTimeout: 30000
        },
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('[DB] Conexion exitosa a SQL Server.');
    } catch (error) {
        console.error('[DB] Error de conexion:', error.message);
        process.exit(1);
    }
};

module.exports = { sequelize, testConnection };
