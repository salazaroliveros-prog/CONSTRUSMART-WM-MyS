-- Migration: Strategic Indexes for Query Performance
-- Description: Creates indexes on frequently filtered columns to improve query performance
-- Date: 2026-07-07

BEGIN;

-- Proyectos: Filter by client
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_cliente_id ON erp_proyectos(cliente_id);

-- Movimientos: Filter by project + date range (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_proyecto_fecha ON erp_movimientos(proyecto_id, fecha);

-- Presupuestos: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto_id ON erp_presupuestos(proyecto_id);

-- Ordenes Compra: Filter by provider + status
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_proveedor_estado ON erp_ordenes_compra(proveedor_id, estado);

-- Avances: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_avances_proyecto_id ON erp_avances(proyecto_id);

-- Hitos: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_hitos_proyecto_id ON erp_hitos(proyecto_id);

-- Riesgos: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_riesgos_proyecto_id ON erp_riesgos(proyecto_id);

-- Notificaciones: Filter by project + read status
CREATE INDEX IF NOT EXISTS idx_erp_notificaciones_proyecto_leida ON erp_notificaciones(proyecto_id, leida);

-- Ordenes Cambio: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_cambio_proyecto_id ON erp_ordenes_cambio(proyecto_id);

-- Cuentas Cobrar: Filter by project + status
CREATE INDEX IF NOT EXISTS idx_erp_cuentas_cobrar_proyecto_estado ON erp_cuentas_cobrar(proyecto_id, estado);

-- Cuentas Pagar: Filter by project + status
CREATE INDEX IF NOT EXISTS idx_erp_cuentas_pagar_proyecto_estado ON erp_cuentas_pagar(proyecto_id, estado);

COMMIT;