-- Migration 095: Restore RLS policies for reference/catalog tables
-- These tables need public read access for authenticated users
-- Fixes: "permission denied for table erp_departamentos_gt"

-- erp_departamentos_gt
DROP POLICY IF EXISTS "departamentos_gt_read_all" ON erp_departamentos_gt;
CREATE POLICY "departamentos_gt_read_all" ON erp_departamentos_gt
  FOR SELECT TO authenticated USING (true);

-- erp_municipios_gt
DROP POLICY IF EXISTS "municipios_gt_read_all" ON erp_municipios_gt;
CREATE POLICY "municipios_gt_read_all" ON erp_municipios_gt
  FOR SELECT TO authenticated USING (true);

-- erp_subtipologias (referenced by motor cálculo)
DROP POLICY IF EXISTS "subtipologias_read_all" ON erp_subtipologias;
CREATE POLICY "subtipologias_read_all" ON erp_subtipologias
  FOR SELECT TO authenticated USING (true);

-- erp_dosificaciones_concreto
DROP POLICY IF EXISTS "dosificaciones_read_all" ON erp_dosificaciones_concreto;
CREATE POLICY "dosificaciones_read_all" ON erp_dosificaciones_concreto
  FOR SELECT TO authenticated USING (true);

-- erp_parametros_climaticos
DROP POLICY IF EXISTS "parametros_climaticos_read_all" ON erp_parametros_climaticos;
CREATE POLICY "parametros_climaticos_read_all" ON erp_parametros_climaticos
  FOR SELECT TO authenticated USING (true);

-- erp_parametros_movimiento_tierra
DROP POLICY IF EXISTS "parametros_mov_tierra_read_all" ON erp_parametros_movimiento_tierra;
CREATE POLICY "parametros_mov_tierra_read_all" ON erp_parametros_movimiento_tierra
  FOR SELECT TO authenticated USING (true);

-- erp_parametros_pavimentos
DROP POLICY IF EXISTS "parametros_pavimentos_read_all" ON erp_parametros_pavimentos;
CREATE POLICY "parametros_pavimentos_read_all" ON erp_parametros_pavimentos
  FOR SELECT TO authenticated USING (true);

-- erp_parametros_redes_infraestructura
DROP POLICY IF EXISTS "parametros_redes_read_all" ON erp_parametros_redes_infraestructura;
CREATE POLICY "parametros_redes_read_all" ON erp_parametros_redes_infraestructura
  FOR SELECT TO authenticated USING (true);

-- erp_parametros_muros_contencion
DROP POLICY IF EXISTS "parametros_muros_read_all" ON erp_parametros_muros_contencion;
CREATE POLICY "parametros_muros_read_all" ON erp_parametros_muros_contencion
  FOR SELECT TO authenticated USING (true);

-- erp_normativa_departamental
DROP POLICY IF EXISTS "normativa_departamental_read_all" ON erp_normativa_departamental;
CREATE POLICY "normativa_departamental_read_all" ON erp_normativa_departamental
  FOR SELECT TO authenticated USING (true);

-- erp_escalas_produccion
DROP POLICY IF EXISTS "escalas_produccion_read_all" ON erp_escalas_produccion;
CREATE POLICY "escalas_produccion_read_all" ON erp_escalas_produccion
  FOR SELECT TO authenticated USING (true);

-- erp_estacionalidad
DROP POLICY IF EXISTS "estacionalidad_read_all" ON erp_estacionalidad;
CREATE POLICY "estacionalidad_read_all" ON erp_estacionalidad
  FOR SELECT TO authenticated USING (true);

-- erp_reglas_factores
DROP POLICY IF EXISTS "reglas_factores_read_all" ON erp_reglas_factores;
CREATE POLICY "reglas_factores_read_all" ON erp_reglas_factores
  FOR SELECT TO authenticated USING (true);

-- NOTA: erp_config_catalogs eliminada de esta migracion porque esa tabla no existe en el esquema actual ni es referenciada por la app.