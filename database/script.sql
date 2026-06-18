-- ============================================================
-- FashionFlow AI - Script Completo de Base de Datos (SQL Server)
-- Tablas: Productos + AgentLogs (Historial del Agente Autonomo)
-- Compatible con SQL Server Local y Somee.com
-- ============================================================

-- Eliminar tablas si existen (para propositos de desarrollo)
IF OBJECT_ID('dbo.AgentLogs', 'U') IS NOT NULL
    DROP TABLE dbo.AgentLogs;
GO

IF OBJECT_ID('dbo.Productos', 'U') IS NOT NULL
    DROP TABLE dbo.Productos;
GO

-- ============================================================
-- TABLA: Productos
-- ============================================================
CREATE TABLE dbo.Productos (
    id              INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    codigoPrenda    VARCHAR(50)     NOT NULL,
    categoria       VARCHAR(60)     NOT NULL,
    talla           VARCHAR(10)     NOT NULL,
    stockActual     INT             NOT NULL DEFAULT 0,
    stockMinimo     INT             NOT NULL DEFAULT 5,
    precioCompra    DECIMAL(10, 2)  NOT NULL,
    precioVenta     DECIMAL(10, 2)  NOT NULL,
    imagenUrl       VARCHAR(500)    NULL,
    createdAt       DATETIME        NOT NULL DEFAULT GETDATE(),
    updatedAt       DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT UQ_Productos_codigoPrenda UNIQUE (codigoPrenda),
    CONSTRAINT CK_Productos_stockActual CHECK (stockActual >= 0),
    CONSTRAINT CK_Productos_precioVenta CHECK (precioVenta > precioCompra)
);
GO

CREATE NONCLUSTERED INDEX IX_Productos_categoria
    ON dbo.Productos (categoria);
GO

CREATE NONCLUSTERED INDEX IX_Productos_codigoPrenda
    ON dbo.Productos (codigoPrenda);
GO

-- ============================================================
-- TABLA: AgentLogs (Bitacora de Decisiones del Agente Autonomo)
-- Almacena cada alerta de stock critico y la orden generada
-- ============================================================
CREATE TABLE dbo.AgentLogs (
    id              INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
    productoId      INT             NOT NULL,
    tipoEvento      VARCHAR(50)     NOT NULL,  -- 'STOCK_CRITICO', 'REABASTECIMIENTO', 'ALERTA_TEMPRANA'
    decision        TEXT            NOT NULL,  -- JSON con la Orden de Compra generada
    justificacion   TEXT            NOT NULL,  -- Explicacion analitica del agente
    leido           TINYINT         NOT NULL DEFAULT 0,  -- 0=no leido, 1=leido
    createdAt       DATETIME        NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_AgentLogs_Producto FOREIGN KEY (productoId)
        REFERENCES dbo.Productos(id)
        ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_AgentLogs_createdAt
    ON dbo.AgentLogs (createdAt DESC);
GO

CREATE NONCLUSTERED INDEX IX_AgentLogs_productoId
    ON dbo.AgentLogs (productoId);
GO

-- ============================================================
-- Datos de Ejemplo (Prendas Deportivas)
-- ============================================================
INSERT INTO dbo.Productos (nombre, codigoPrenda, categoria, talla, stockActual, stockMinimo, precioCompra, precioVenta, imagenUrl)
VALUES
('Polo Deportivo Pro',      'POL-NIKE-001', 'Polos',       'M',  25, 5,  35.00, 79.90, 'https://via.placeholder.com/300x400?text=Polo+Nike'),
('Casaca Impermeable',      'CAS-ADID-002', 'Casacas',     'L',  3,  5,  80.00, 159.90, 'https://via.placeholder.com/300x400?text=Casaca+Adidas'),
('Pantalon Jogger Elite',   'PAN-PUM-003',  'Pantalones',  'S',  8,  5,  40.00, 89.90, 'https://via.placeholder.com/300x400?text=Jogger+Puma'),
('Short Running Tech',      'SHO-NIKE-004', 'Shorts',      'M',  2,  5,  25.00, 59.90, 'https://via.placeholder.com/300x400?text=Short+Nike'),
('Polera Termica',          'POL-UND-005',  'Polos',       'XL', 1,  5,  30.00, 69.90, 'https://via.placeholder.com/300x400?text=Polera+Under'),
('Chaqueta Deportiva',      'CHA-NIKE-006', 'Casacas',     'S',  18, 5,  90.00, 199.90, 'https://via.placeholder.com/300x400?text=Chaqueta+Nike'),
('Leggings Yoga Fit',       'LEG-LUL-007',  'Pantalones',  'M',  6,  4,  45.00, 99.90, 'https://via.placeholder.com/300x400?text=Leggings+Lululemon'),
('Gorra Running Shield',    'GOR-NIKE-008', 'Accesorios',  'UN', 15, 5,  15.00, 39.90, 'https://via.placeholder.com/300x400?text=Gorra+Nike'),
('Zapatillas Air Max',      'ZAP-NIKE-009', 'Calzado',     '42', 2,  3,  120.00, 249.90, 'https://via.placeholder.com/300x400?text=Zapatillas+Nike'),
('Camiseta Seleccion',      'CAM-ADID-010', 'Polos',       'L',  1,  5,  28.00, 64.90, 'https://via.placeholder.com/300x400?text=Camiseta+Adidas');
GO

PRINT 'Base de datos FashionFlow AI creada exitosamente.';
GO
