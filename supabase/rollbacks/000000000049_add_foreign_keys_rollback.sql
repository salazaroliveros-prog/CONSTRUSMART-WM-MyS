-- Rollback for Migration 049: Remove Foreign Key Constraints
-- Purpose: Remove foreign key constraints added in migration 049
-- Risk: Low - only removes constraints, no data loss

-- ============================================================
-- Step 1: Remove foreign key constraints for proyecto_id (must be done before reverting column types)
-- ============================================================

ALTER TABLE erp_activos DROP CONSTRAINT IF EXISTS fk_erp_activos_proyecto;
ALTER TABLE activos_herramientas DROP CONSTRAINT IF EXISTS fk_activos_herramientas_proyecto;
ALTER TABLE erp_aplicacion_escalas DROP CONSTRAINT IF EXISTS fk_erp_aplicacion_escalas_proyecto;
ALTER TABLE erp_avances DROP CONSTRAINT IF EXISTS fk_erp_avances_proyecto;
ALTER TABLE erp_bitacora DROP CONSTRAINT IF EXISTS fk_erp_bitacora_proyecto;
ALTER TABLE erp_calculos_proyecto DROP CONSTRAINT IF EXISTS fk_erp_calculos_proyecto_proyecto;
ALTER TABLE erp_cuadros DROP CONSTRAINT IF EXISTS fk_erp_cuadros_proyecto;
ALTER TABLE cuadro_comparativo_proveedores DROP CONSTRAINT IF EXISTS fk_cuadro_comparativo_proveedores_proyecto;
ALTER TABLE erp_cuentas_cobrar DROP CONSTRAINT IF EXISTS fk_erp_cuentas_cobrar_proyecto;
ALTER TABLE erp_cuentas_pagar DROP CONSTRAINT IF EXISTS fk_erp_cuentas_pagar_proyecto;
ALTER TABLE erp_cumplimiento_normativo DROP CONSTRAINT IF EXISTS fk_erp_cumplimiento_normativo_proyecto;
ALTER TABLE erp_empleados DROP CONSTRAINT IF EXISTS fk_erp_empleados_proyecto;
ALTER TABLE erp_eventos_calendario DROP CONSTRAINT IF EXISTS fk_erp_eventos_calendario_proyecto;
ALTER TABLE erp_historial_aplicacion_reglas DROP CONSTRAINT IF EXISTS fk_erp_historial_aplicacion_reglas_proyecto;
ALTER TABLE erp_hitos DROP CONSTRAINT IF EXISTS fk_erp_hitos_proyecto;
ALTER TABLE erp_incidentes DROP CONSTRAINT IF EXISTS fk_erp_incidentes_proyecto;
ALTER TABLE erp_liberaciones_partida DROP CONSTRAINT IF EXISTS fk_erp_liberaciones_partida_proyecto;
ALTER TABLE erp_licitaciones DROP CONSTRAINT IF EXISTS fk_erp_licitaciones_proyecto;
ALTER TABLE erp_movimientos DROP CONSTRAINT IF EXISTS fk_erp_movimientos_proyecto;
ALTER TABLE erp_muro DROP CONSTRAINT IF EXISTS fk_erp_muro_proyecto;
ALTER TABLE erp_no_conformidades DROP CONSTRAINT IF EXISTS fk_erp_no_conformidades_proyecto;
ALTER TABLE erp_notificaciones DROP CONSTRAINT IF EXISTS fk_erp_notificaciones_proyecto;
ALTER TABLE erp_ordenes_cambio DROP CONSTRAINT IF EXISTS fk_erp_ordenes_cambio_proyecto;
ALTER TABLE erp_ordenes_compra DROP CONSTRAINT IF EXISTS fk_erp_ordenes_compra_proyecto;
ALTER TABLE erp_planos DROP CONSTRAINT IF EXISTS fk_erp_planos_proyecto;
ALTER TABLE erp_proyecto_miembros DROP CONSTRAINT IF EXISTS fk_erp_proyecto_miembros_proyecto;
ALTER TABLE erp_pruebas_laboratorio DROP CONSTRAINT IF EXISTS fk_erp_pruebas_laboratorio_proyecto;
ALTER TABLE erp_renglones DROP CONSTRAINT IF EXISTS fk_erp_renglones_proyecto;
ALTER TABLE erp_rfis DROP CONSTRAINT IF EXISTS fk_erp_rfis_proyecto;
ALTER TABLE erp_riesgos DROP CONSTRAINT IF EXISTS fk_erp_riesgos_proyecto;
ALTER TABLE erp_seguimiento DROP CONSTRAINT IF EXISTS fk_erp_seguimiento_proyecto;
ALTER TABLE erp_seguimiento_evm DROP CONSTRAINT IF EXISTS fk_erp_seguimiento_evm_proyecto;
ALTER TABLE erp_submittals DROP CONSTRAINT IF EXISTS fk_erp_submittals_proyecto;
ALTER TABLE erp_vales_salida DROP CONSTRAINT IF EXISTS fk_erp_vales_salida_proyecto;

-- ============================================================
-- Step 2: Drop RLS policies that depend on proyecto_id
-- ============================================================

DROP POLICY IF EXISTS aplicacion_escalas_read_own ON erp_aplicacion_escalas;
DROP POLICY IF EXISTS aplicacion_escalas_update_own ON erp_aplicacion_escalas;
DROP POLICY IF EXISTS aplicacion_escalas_insert_own ON erp_aplicacion_escalas;
DROP POLICY IF EXISTS aplicacion_escalas_delete_own ON erp_aplicacion_escalas;
DROP POLICY IF EXISTS cumplimiento_normativo_read_own ON erp_cumplimiento_normativo;
DROP POLICY IF EXISTS cumplimiento_normativo_update_own ON erp_cumplimiento_normativo;
DROP POLICY IF EXISTS cumplimiento_normativo_insert_own ON erp_cumplimiento_normativo;
DROP POLICY IF EXISTS cumplimiento_normativo_delete_own ON erp_cumplimiento_normativo;
DROP POLICY IF EXISTS calculos_proyecto_read_own ON erp_calculos_proyecto;
DROP POLICY IF EXISTS calculos_proyecto_update_own ON erp_calculos_proyecto;
DROP POLICY IF EXISTS calculos_proyecto_insert_own ON erp_calculos_proyecto;
DROP POLICY IF EXISTS calculos_proyecto_delete_own ON erp_calculos_proyecto;
DROP POLICY IF EXISTS historial_aplicacion_reglas_read_own ON erp_historial_aplicacion_reglas;
DROP POLICY IF EXISTS historial_aplicacion_reglas_update_own ON erp_historial_aplicacion_reglas;
DROP POLICY IF EXISTS historial_aplicacion_reglas_insert_own ON erp_historial_aplicacion_reglas;
DROP POLICY IF EXISTS historial_aplicacion_reglas_delete_own ON erp_historial_aplicacion_reglas;

-- ============================================================
-- Step 3: Revert column type changes (uuid -> text for proyecto_id)
-- ============================================================

-- Convert proyecto_id back to text in tables that were changed
ALTER TABLE erp_aplicacion_escalas
ALTER COLUMN proyecto_id TYPE text USING proyecto_id::text;

ALTER TABLE erp_cumplimiento_normativo
ALTER COLUMN proyecto_id TYPE text USING proyecto_id::text;

ALTER TABLE erp_calculos_proyecto
ALTER COLUMN proyecto_id TYPE text USING proyecto_id::text;

ALTER TABLE erp_historial_aplicacion_reglas
ALTER COLUMN proyecto_id TYPE text USING proyecto_id::text;

-- ============================================================
-- Step 4: Recreate RLS policies with text type
-- ============================================================

CREATE POLICY aplicacion_escalas_read_own ON erp_aplicacion_escalas
  FOR SELECT USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY aplicacion_escalas_update_own ON erp_aplicacion_escalas
  FOR UPDATE USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY aplicacion_escalas_insert_own ON erp_aplicacion_escalas
  FOR INSERT WITH CHECK (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY aplicacion_escalas_delete_own ON erp_aplicacion_escalas
  FOR DELETE USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY cumplimiento_normativo_read_own ON erp_cumplimiento_normativo
  FOR SELECT USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY cumplimiento_normativo_update_own ON erp_cumplimiento_normativo
  FOR UPDATE USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY cumplimiento_normativo_insert_own ON erp_cumplimiento_normativo
  FOR INSERT WITH CHECK (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY cumplimiento_normativo_delete_own ON erp_cumplimiento_normativo
  FOR DELETE USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY calculos_proyecto_read_own ON erp_calculos_proyecto
  FOR SELECT USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY calculos_proyecto_update_own ON erp_calculos_proyecto
  FOR UPDATE USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY calculos_proyecto_insert_own ON erp_calculos_proyecto
  FOR INSERT WITH CHECK (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY calculos_proyecto_delete_own ON erp_calculos_proyecto
  FOR DELETE USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY historial_aplicacion_reglas_read_own ON erp_historial_aplicacion_reglas
  FOR SELECT USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY historial_aplicacion_reglas_update_own ON erp_historial_aplicacion_reglas
  FOR UPDATE USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY historial_aplicacion_reglas_insert_own ON erp_historial_aplicacion_reglas
  FOR INSERT WITH CHECK (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

CREATE POLICY historial_aplicacion_reglas_delete_own ON erp_historial_aplicacion_reglas
  FOR DELETE USING (proyecto_id IN (SELECT proyecto_id FROM erp_proyecto_miembros WHERE user_id = auth.uid()));

-- ============================================================
-- Step 5: Remove foreign key constraints for created_by
-- ============================================================

ALTER TABLE erp_activos DROP CONSTRAINT IF EXISTS fk_erp_activos_created_by;
ALTER TABLE activos_herramientas DROP CONSTRAINT IF EXISTS fk_activos_herramientas_created_by;
ALTER TABLE erp_avances DROP CONSTRAINT IF EXISTS fk_erp_avances_created_by;
ALTER TABLE erp_cuadros DROP CONSTRAINT IF EXISTS fk_erp_cuadros_created_by;
ALTER TABLE cuadro_comparativo_proveedores DROP CONSTRAINT IF EXISTS fk_cuadro_comparativo_proveedores_created_by;
ALTER TABLE erp_cuentas_cobrar DROP CONSTRAINT IF EXISTS fk_erp_cuentas_cobrar_created_by;
ALTER TABLE erp_cuentas_pagar DROP CONSTRAINT IF EXISTS fk_erp_cuentas_pagar_created_by;
ALTER TABLE erp_eventos_calendario DROP CONSTRAINT IF EXISTS fk_erp_eventos_calendario_created_by;
ALTER TABLE erp_hitos DROP CONSTRAINT IF EXISTS fk_erp_hitos_created_by;
ALTER TABLE erp_incidentes DROP CONSTRAINT IF EXISTS fk_erp_incidentes_created_by;
ALTER TABLE erp_liberaciones_partida DROP CONSTRAINT IF EXISTS fk_erp_liberaciones_partida_created_by;
ALTER TABLE erp_licitaciones DROP CONSTRAINT IF EXISTS fk_erp_licitaciones_created_by;
ALTER TABLE erp_muro DROP CONSTRAINT IF EXISTS fk_erp_muro_created_by;
ALTER TABLE erp_no_conformidades DROP CONSTRAINT IF EXISTS fk_erp_no_conformidades_created_by;
ALTER TABLE erp_ordenes_cambio DROP CONSTRAINT IF EXISTS fk_erp_ordenes_cambio_created_by;
ALTER TABLE erp_planos DROP CONSTRAINT IF EXISTS fk_erp_planos_created_by;
ALTER TABLE erp_pruebas_laboratorio DROP CONSTRAINT IF EXISTS fk_erp_pruebas_laboratorio_created_by;
ALTER TABLE erp_rendimientos_cuadrilla DROP CONSTRAINT IF EXISTS fk_erp_rendimientos_cuadrilla_created_by;
ALTER TABLE erp_rfis DROP CONSTRAINT IF EXISTS fk_erp_rfis_created_by;
ALTER TABLE erp_riesgos DROP CONSTRAINT IF EXISTS fk_erp_riesgos_created_by;
ALTER TABLE erp_seguimiento DROP CONSTRAINT IF EXISTS fk_erp_seguimiento_created_by;
ALTER TABLE erp_submittals DROP CONSTRAINT IF EXISTS fk_erp_submittals_created_by;
ALTER TABLE erp_vales_salida DROP CONSTRAINT IF EXISTS fk_erp_vales_salida_created_by;

-- ============================================================
-- Step 6: Remove other foreign key constraints
-- ============================================================

-- No additional foreign key constraints were added in Step 3 (all commented out)
-- ALTER TABLE erp_ordenes_compra DROP CONSTRAINT IF EXISTS fk_erp_ordenes_compra_proveedor;
-- ALTER TABLE erp_vales_salida DROP CONSTRAINT IF EXISTS fk_erp_vales_salida_material;
