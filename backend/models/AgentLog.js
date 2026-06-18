// ============================================================
// FashionFlow AI - Modelo AgentLog (Sequelize)
// Bitacora de decisiones del Agente Residente Autonomo
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AgentLog = sequelize.define('AgentLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipoEvento: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    decision: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    justificacion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    leido: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'AgentLogs',
    timestamps: true,
    updatedAt: false
});

// Relacion con Producto
AgentLog.associate = (models) => {
    AgentLog.belongsTo(models.Producto, {
        foreignKey: 'productoId',
        as: 'producto'
    });
};

module.exports = AgentLog;
