-- Migration: Apply corrected strategic indexes
-- Context: 000000000067 was recorded as applied but failed at line 8
-- (column cliente_id does not exist) causing the whole transaction to roll back.
-- This migration recreates the indexes with the correct column names.

-- Proyectos: Filter by client
CREATE INDEX IF NOT EXISTS idx_erp_proyectos_cliente ON erp_proyectos(cliente);

-- Movimientos: Filter by project + date range
CREATE INDEX IF NOT EXISTS idx_erp_movimientos_proyecto_fecha ON erp_movimientos(proyecto_id, fecha);

-- Presupuestos: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto_id ON erp_presupuestos(proyecto_id);

-- Ordenes Compra: Filter by provider + status
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_proveedor_estado ON erp_ordenes_compra(proveedor, estado);

-- Avances: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_avances_proyecto_id ON erp_avances(proyecto_id);

-- Hitos: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_hitos_proyecto_id ON erp_hitos(proyecto_id);

-- Riesgos: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_riesgos_proyecto_id ON erp_riesgos(proyecto_id);

-- Notificaciones: Filter by project + read status
CREATE INDEX IF NOT EXISTS idx_erp_notificaciones_proyecto_leido ON erp_notificaciones(proyecto_id, leido);

-- Ordenes Cambio: Filter by project
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_cambio_proyecto_id ON erp_ordenes_cambio(proyecto_id);

-- Cuentas Cobrar: Filter by project + status
CREATE INDEX IF NOT EXISTS idx_erp_cuentas_cobrar_proyecto_estado ON erp_cuentas_cobrar(proyecto_id, estado);

-- Cuentas Pagar: Filter by project + status
CREATE INDEX IF NOT EXISTS idx_erp_cuentas_pagar_proyecto_estado ON erp_cuentas_pagar(proyecto_id, estado);
