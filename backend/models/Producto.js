// ============================================================
// FashionFlow AI - Modelo Producto (Sequelize)
// ============================================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Producto = sequelize.define('Producto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: { msg: 'El nombre es obligatorio' } }
    },
    codigoPrenda: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: { notEmpty: { msg: 'El codigo de prenda es obligatorio' } }
    },
    categoria: {
        type: DataTypes.STRING(60),
        allowNull: false,
        validate: { notEmpty: { msg: 'La categoria es obligatoria' } }
    },
    talla: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: { notEmpty: { msg: 'La talla es obligatoria' } }
    },
    stockActual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: { args: [0], msg: 'El stock no puede ser negativo' } }
    },
    stockMinimo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
    },
    precioCompra: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: { args: [0.01], msg: 'El precio de compra debe ser mayor a 0' } }
    },
    precioVenta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            esMayorQueCompra(value) {
                if (parseFloat(value) <= parseFloat(this.precioCompra)) {
                    throw new Error('El precio de venta debe ser mayor que el precio de compra');
                }
            }
        }
    },
    imagenUrl: {
        type: DataTypes.STRING(500),
        allowNull: true
    }
}, {
    tableName: 'Productos',
    timestamps: true
});

module.exports = Producto;
