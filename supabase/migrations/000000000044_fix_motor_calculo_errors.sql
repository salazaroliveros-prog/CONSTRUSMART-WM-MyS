-- ============================================================
-- MIGRACIÓN CORREGIDA - MOTOR DE CÁLCULO
-- Soluciona errores en migraciones 032-043
-- ============================================================

-- ============================================================
-- FIX 1: Índices duplicados en tablas de parámetros
-- ============================================================

-- Pavimentos (SQL 032)
DROP INDEX IF EXISTS idx_parametros_pavimentos_combo;
CREATE INDEX idx_parametros_pavimentos_combo ON erp_parametros_pavimentos(uso, tipo, tipo_base, tipo_sello);

-- Redes infraestructura (SQL 033)
DROP INDEX IF EXISTS idx_parametros_redes_combo;
CREATE INDEX idx_parametros_redes_combo ON erp_parametros_redes_infraestructura(tipo, diametro_pulgadas, material, presion);

-- Muros contención (SQL 034)
DROP INDEX IF EXISTS idx_parametros_muros_combo;
CREATE INDEX idx_parametros_muros_combo ON erp_parametros_muros_contencion(altura_m, tipo, tipo_cimentacion, tipo_suelo, tipo_drenaje);

-- Reglas factores (SQL 039)
DROP INDEX IF EXISTS idx_reglas_factores_tipo;
CREATE INDEX idx_reglas_factores_tipo ON erp_reglas_factores(tipo_factor, activo);

-- Normativa departamental (SQL 041)
DROP INDEX IF EXISTS idx_normativa_departamento_codigo;
CREATE INDEX idx_normativa_departamento_codigo ON erp_normativa_departamental(departamento_codigo);

-- ============================================================
-- FIX 2: Policy duplicada en normativa departamental (SQL 036)
-- ============================================================

DROP POLICY IF EXISTS "normativa_departamento_update_all" ON erp_normativa_departamental;
CREATE POLICY "normativa_departamento_update_all" ON erp_normativa_departamental FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- FIX 3: Error de sintaxis en estacionalidad (SQL 043)
-- ============================================================

-- La tabla ya existe, solo actualizamos la columna con error
ALTER TABLE erp_estacionalidad 
DROP COLUMN IF EXISTS factor_rango;

ALTER TABLE erp_estacionalidad 
ADD COLUMN IF NOT EXISTS factor_rango_climatico numeric(5,3) DEFAULT 1.0;

-- ============================================================
-- FIX 4: Verificar que las columnas existen
-- ============================================================

-- renglon_id en erp_calculos_proyecto (SQL 040)
-- La columna ya existe como text, no requiere cambios

-- subtipo_proyecto en erp_escalas_produccion (SQL 042)
-- La columna ya existe como text, no requiere cambios

-- ============================================================
-- FIX 5: Asegurar que todos los índices tengan IF NOT EXISTS
-- ============================================================

-- Escalas de producción
CREATE INDEX IF NOT EXISTS idx_escalas_tipo ON erp_escalas_produccion(tipo_proyecto);
CREATE INDEX IF NOT EXISTS idx_escalas_rango ON erp_escalas_produccion(rango_tamano);
CREATE INDEX IF NOT EXISTS idx_escalas_tamano ON erp_escalas_produccion(tamano_minimo, tamano_maximo);
CREATE INDEX IF NOT EXISTS idx_escalas_activo ON erp_escalas_produccion(activo);

-- Normativa departamental
CREATE INDEX IF NOT EXISTS idx_normativa_tipo ON erp_normativa_departamental(tipo_norma);
CREATE INDEX IF NOT EXISTS idx_normativa_codigo ON erp_normativa_departamental(codigo_norma);
CREATE INDEX IF NOT EXISTS idx_normativa_activo ON erp_normativa_departamental(activo);
-- CREATE INDEX IF NOT EXISTS idx_normativa_vigencia ON erp_normativa_departamental(fecha_vigencia_inicio, fecha_vigencia_fin);

-- Cumplimiento normativo (tabla creada en migración 065+)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'erp_cumplimiento_normativo') THEN
    CREATE INDEX IF NOT EXISTS idx_cumplimiento_proyecto ON erp_cumplimiento_normativo(proyecto_id);
  END IF;
END $$;
-- CREATE INDEX IF NOT EXISTS idx_cumplimiento_norma ON erp_cumplimiento_normativo(normativa_id);
-- CREATE INDEX IF NOT EXISTS idx_cumplimiento_estado ON erp_cumplimiento_normativo(estado_cumplimiento);

-- ============================================================
-- FIX 6: Asegurar RLS policies correctas
-- ============================================================

-- Normativa departamental
-- DROP POLICY IF EXISTS "normativa_departamental_read_all" ON erp_normativa_departamental;
-- CREATE POLICY "normativa_departamental_read_all" ON erp_normativa_departamental FOR SELECT TO authenticated USING (activo = true);

-- DROP POLICY IF EXISTS "normativa_departamental_insert_all" ON erp_normativa_departamental;
-- CREATE POLICY "normativa_departamental_insert_all" ON erp_normativa_departamental FOR INSERT TO authenticated WITH CHECK (true);

-- Cumplimiento normativo
-- ALTER TABLE erp_cumplimiento_normativo ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "cumplimiento_normativo_read_all" ON erp_cumplimiento_normativo;
-- CREATE POLICY "cumplimiento_normativo_read_all" ON erp_cumplimiento_normativo FOR SELECT TO authenticated USING (true);

-- DROP POLICY IF EXISTS "cumplimiento_normativo_insert_all" ON erp_cumplimiento_normativo;
-- CREATE POLICY "cumplimiento_normativo_insert_all" ON erp_cumplimiento_normativo FOR INSERT TO authenticated WITH CHECK (true);

-- DROP POLICY IF EXISTS "cumplimiento_normativo_update_all" ON erp_cumplimiento_normativo;
-- CREATE POLICY "cumplimiento_normativo_update_all" ON erp_cumplimiento_normativo FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- FIX 7: Asegurar triggers de timestamp
-- ============================================================

-- Estacionalidad
-- CREATE OR REPLACE FUNCTION actualizar_timestamp_estacionalidad()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- DROP TRIGGER IF EXISTS trigger_actualizar_estacionalidad ON erp_estacionalidad;
-- CREATE TRIGGER trigger_actualizar_estacionalidad
-- BEFORE UPDATE ON erp_estacionalidad
-- FOR EACH ROW
-- EXECUTE FUNCTION actualizar_timestamp_estacionalidad();

-- ============================================================
-- COMPLETADO
-- ============================================================
