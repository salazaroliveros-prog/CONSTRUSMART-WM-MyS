-- Migration 048: Add Missing Indexes
-- This migration adds indexes on frequently queried columns to improve performance

-- Phase 1: Create indexes on proyecto_id for transactional tables
CREATE INDEX IF NOT EXISTS idx_erp_activos_proyecto_id ON erp_activos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_activos_herramienta_proyecto_id ON erp_activos_herramienta(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_cuadros_proyecto_id ON erp_cuadros(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_cuadros_comparativos_proyecto_id ON erp_cuadros_comparativos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_cuentas_cobrar_proyecto_id ON erp_cuentas_cobrar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_cuentas_pagar_proyecto_id ON erp_cuentas_pagar(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_eventos_calendario_proyecto_id ON erp_eventos_calendario(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_hitos_proyecto_id ON erp_hitos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_incidentes_proyecto_id ON erp_incidentes(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_incidentes_sso_proyecto_id ON erp_incidentes_sso(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_liberaciones_partida_proyecto_id ON erp_liberaciones_partida(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_licitaciones_proyecto_id ON erp_licitaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_muro_proyecto_id ON erp_muro(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_no_conformidades_proyecto_id ON erp_no_conformidades(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_notificaciones_proyecto_id ON erp_notificaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_cambio_proyecto_id ON erp_ordenes_cambio(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_proyecto_id ON erp_ordenes_compra(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_planos_proyecto_id ON erp_planos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto_id ON erp_presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_pruebas_laboratorio_proyecto_id ON erp_pruebas_laboratorio(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_publicaciones_muro_proyecto_id ON erp_publicaciones_muro(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_rfis_proyecto_id ON erp_rfis(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_riesgos_proyecto_id ON erp_riesgos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_proyecto_id ON erp_seguimiento(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_submittals_proyecto_id ON erp_submittals(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_proyecto_id ON erp_vales_salida(proyecto_id);

-- Phase 2: Create indexes on created_by for audit trails and user activity tracking
CREATE INDEX IF NOT EXISTS idx_erp_activos_created_by ON erp_activos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_activos_herramienta_created_by ON erp_activos_herramienta(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_avances_created_by ON erp_avances(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_cuadros_created_by ON erp_cuadros(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_cuadros_comparativos_created_by ON erp_cuadros_comparativos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_cuentas_cobrar_created_by ON erp_cuentas_cobrar(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_cuentas_pagar_created_by ON erp_cuentas_pagar(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_eventos_calendario_created_by ON erp_eventos_calendario(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_hitos_created_by ON erp_hitos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_incidentes_created_by ON erp_incidentes(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_incidentes_sso_created_by ON erp_incidentes_sso(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_liberaciones_partida_created_by ON erp_liberaciones_partida(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_licitaciones_created_by ON erp_licitaciones(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_muro_created_by ON erp_muro(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_no_conformidades_created_by ON erp_no_conformidades(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_cambio_created_by ON erp_ordenes_cambio(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_planos_created_by ON erp_planos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_created_by ON erp_presupuestos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_pruebas_laboratorio_created_by ON erp_pruebas_laboratorio(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_publicaciones_muro_created_by ON erp_publicaciones_muro(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_rendimientos_cuadrilla_created_by ON erp_rendimientos_cuadrilla(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_rfis_created_by ON erp_rfis(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_riesgos_created_by ON erp_riesgos(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_seguimiento_created_by ON erp_seguimiento(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_submittals_created_by ON erp_submittals(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_created_by ON erp_vales_salida(created_by);

-- Phase 3: Create composite indexes for common query patterns
-- Composite index for filtering by project and creation date
CREATE INDEX IF NOT EXISTS idx_erp_cuadros_proyecto_created ON erp_cuadros(proyecto_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_presupuestos_proyecto_created ON erp_presupuestos(proyecto_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_proyecto_created ON erp_ordenes_compra(proyecto_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_proyecto_created ON erp_vales_salida(proyecto_id, created_at DESC);

-- Composite index for filtering by project and status
CREATE INDEX IF NOT EXISTS idx_erp_ordenes_compra_proyecto_estado ON erp_ordenes_compra(proyecto_id, estado);
CREATE INDEX IF NOT EXISTS idx_erp_vales_salida_proyecto_estado ON erp_vales_salida(proyecto_id, estado);
CREATE INDEX IF NOT EXISTS idx_erp_incidentes_proyecto_estado ON erp_incidentes(proyecto_id, estado);

-- Rollback function
CREATE OR REPLACE FUNCTION rollback_048_add_missing_indexes()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Drop proyecto_id indexes
  DROP INDEX IF EXISTS idx_erp_activos_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_activos_herramienta_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_cuadros_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_cuadros_comparativos_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_cuentas_cobrar_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_cuentas_pagar_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_eventos_calendario_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_hitos_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_incidentes_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_incidentes_sso_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_liberaciones_partida_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_licitaciones_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_muro_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_no_conformidades_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_notificaciones_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_ordenes_cambio_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_ordenes_compra_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_planos_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_presupuestos_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_pruebas_laboratorio_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_publicaciones_muro_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_rfis_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_riesgos_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_seguimiento_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_submittals_proyecto_id;
  DROP INDEX IF EXISTS idx_erp_vales_salida_proyecto_id;

  -- Drop created_by indexes
  DROP INDEX IF EXISTS idx_erp_activos_created_by;
  DROP INDEX IF EXISTS idx_erp_activos_herramienta_created_by;
  DROP INDEX IF EXISTS idx_erp_avances_created_by;
  DROP INDEX IF EXISTS idx_erp_cuadros_created_by;
  DROP INDEX IF EXISTS idx_erp_cuadros_comparativos_created_by;
  DROP INDEX IF EXISTS idx_erp_cuentas_cobrar_created_by;
  DROP INDEX IF EXISTS idx_erp_cuentas_pagar_created_by;
  DROP INDEX IF EXISTS idx_erp_eventos_calendario_created_by;
  DROP INDEX IF EXISTS idx_erp_hitos_created_by;
  DROP INDEX IF EXISTS idx_erp_incidentes_created_by;
  DROP INDEX IF EXISTS idx_erp_incidentes_sso_created_by;
  DROP INDEX IF EXISTS idx_erp_liberaciones_partida_created_by;
  DROP INDEX IF EXISTS idx_erp_licitaciones_created_by;
  DROP INDEX IF EXISTS idx_erp_muro_created_by;
  DROP INDEX IF EXISTS idx_erp_no_conformidades_created_by;
  DROP INDEX IF EXISTS idx_erp_ordenes_cambio_created_by;
  DROP INDEX IF EXISTS idx_erp_planos_created_by;
  DROP INDEX IF EXISTS idx_erp_presupuestos_created_by;
  DROP INDEX IF EXISTS idx_erp_pruebas_laboratorio_created_by;
  DROP INDEX IF EXISTS idx_erp_publicaciones_muro_created_by;
  DROP INDEX IF EXISTS idx_erp_rendimientos_cuadrilla_created_by;
  DROP INDEX IF EXISTS idx_erp_rfis_created_by;
  DROP INDEX IF EXISTS idx_erp_riesgos_created_by;
  DROP INDEX IF EXISTS idx_erp_seguimiento_created_by;
  DROP INDEX IF EXISTS idx_erp_submittals_created_by;
  DROP INDEX IF EXISTS idx_erp_vales_salida_created_by;

  -- Drop composite indexes
  DROP INDEX IF EXISTS idx_erp_cuadros_proyecto_created;
  DROP INDEX IF EXISTS idx_erp_presupuestos_proyecto_created;
  DROP INDEX IF EXISTS idx_erp_ordenes_compra_proyecto_created;
  DROP INDEX IF EXISTS idx_erp_vales_salida_proyecto_created;
  DROP INDEX IF EXISTS idx_erp_ordenes_compra_proyecto_estado;
  DROP INDEX IF EXISTS idx_erp_vales_salida_proyecto_estado;
  DROP INDEX IF EXISTS idx_erp_incidentes_proyecto_estado;
END;
$$;
