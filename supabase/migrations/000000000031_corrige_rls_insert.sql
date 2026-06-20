-- ============================================================
-- CORRECCIÓN RLS: PERMITIR INSERT PARA DATOS DE REFERENCIA
-- Versión: 2026-06-19
-- ============================================================

-- TABLA DEPARTAMENTOS
DROP POLICY IF EXISTS "departamentos_gt_read_all" ON erp_departamentos_gt;
CREATE POLICY "departamentos_gt_read_all" ON erp_departamentos_gt FOR SELECT TO authenticated USING (true);
CREATE POLICY "departamentos_gt_insert_all" ON erp_departamentos_gt FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "departamentos_gt_update_all" ON erp_departamentos_gt FOR UPDATE TO authenticated USING (true);

-- TABLA MUNICIPIOS
DROP POLICY IF EXISTS "municipios_gt_read_all" ON erp_municipios_gt;
CREATE POLICY "municipios_gt_read_all" ON erp_municipios_gt FOR SELECT TO authenticated USING (true);
CREATE POLICY "municipios_gt_insert_all" ON erp_municipios_gt FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "municipios_gt_update_all" ON erp_municipios_gt FOR UPDATE TO authenticated USING (true);

-- TABLA DOSIFICACIONES
ALTER TABLE erp_dosificaciones_concreto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dosificaciones_concreto_read_all" ON erp_dosificaciones_concreto;
CREATE POLICY "dosificaciones_concreto_read_all" ON erp_dosificaciones_concreto FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "dosificaciones_concreto_insert_all" ON erp_dosificaciones_concreto FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "dosificaciones_concreto_update_all" ON erp_dosificaciones_concreto FOR UPDATE TO authenticated USING (true);

-- TABLA SUBTIPOLOGIAS
ALTER TABLE erp_subtipologias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subtipologias_read_all" ON erp_subtipologias;
CREATE POLICY "subtipologias_read_all" ON erp_subtipologias FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "subtipologias_insert_all" ON erp_subtipologias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "subtipologias_update_all" ON erp_subtipologias FOR UPDATE TO authenticated USING (true);

-- TABLA REFERENCIAS ACERO
DROP POLICY IF EXISTS "referencias_acero_read_all" ON erp_referencias_acero;
CREATE POLICY "referencias_acero_read_all" ON erp_referencias_acero FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "referencias_acero_insert_all" ON erp_referencias_acero FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "referencias_acero_update_all" ON erp_referencias_acero FOR UPDATE TO authenticated USING (true);

-- TABLA PRECIOS ACERO
DROP POLICY IF EXISTS "precios_acero_read_all" ON erp_precios_acero;
CREATE POLICY "precios_acero_read_all" ON erp_precios_acero FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "precios_acero_insert_all" ON erp_precios_acero FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "precios_acero_update_all" ON erp_precios_acero FOR UPDATE TO authenticated USING (true);

-- TABLA PARAMETROS MOVIMIENTO TIERRA
DROP POLICY IF EXISTS "parametros_movimiento_tierra_read_all" ON erp_parametros_movimiento_tierra;
CREATE POLICY "parametros_movimiento_tierra_read_all" ON erp_parametros_movimiento_tierra FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "parametros_movimiento_tierra_insert_all" ON erp_parametros_movimiento_tierra FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "parametros_movimiento_tierra_update_all" ON erp_parametros_movimiento_tierra FOR UPDATE TO authenticated USING (true);

-- TABLA PARAMETROS CLIMATICOS
DROP POLICY IF EXISTS "parametros_climaticos_read_all" ON erp_parametros_climaticos;
CREATE POLICY "parametros_climaticos_read_all" ON erp_parametros_climaticos FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "parametros_climaticos_insert_all" ON erp_parametros_climaticos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "parametros_climaticos_update_all" ON erp_parametros_climaticos FOR UPDATE TO authenticated USING (true);