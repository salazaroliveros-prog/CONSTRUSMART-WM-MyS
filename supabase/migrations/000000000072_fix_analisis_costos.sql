-- Migration 072: Fix Analisis Costos — column ambiguity (42702) + RLS permissions (42501)

-- ============================================================
-- FIX 0: Borrar función existente para poder recrear con nuevo nombre de parámetro
-- ============================================================

DROP FUNCTION IF EXISTS obtener_historial_calculos(uuid,text);

-- ============================================================
-- FIX 1: Recrear obtener_historial_calculos con parámetro renombrado
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_historial_calculos(
  p_proyecto_id uuid,
  p_tipo_calculo_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  tipo_calculo text,
  fecha_calculo timestamptz,
  version_calculo integer,
  origen_calculo text,
  parametros jsonb,
  resultados jsonb,
  validado boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.tipo_calculo,
    c.fecha_calculo,
    c.version_calculo,
    c.origen_calculo,
    c.parametros,
    c.resultados,
    c.validado
  FROM erp_calculos_proyecto c
  WHERE c.proyecto_id = p_proyecto_id
    AND (p_tipo_calculo_filter IS NULL OR c.tipo_calculo = p_tipo_calculo_filter)
  ORDER BY c.fecha_calculo DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FIX 2: Reemplazar registrar_calculo con todos los parámetros que usa el frontend
-- ============================================================

DROP FUNCTION IF EXISTS registrar_calculo(uuid,text,jsonb,jsonb,uuid,numeric,numeric,uuid,text);

CREATE OR REPLACE FUNCTION registrar_calculo(
  p_proyecto_id uuid,
  p_tipo_calculo text,
  p_parametros jsonb,
  p_resultados jsonb,
  p_renglon_id uuid DEFAULT NULL,
  p_costo_total numeric DEFAULT NULL,
  p_costo_unitario numeric DEFAULT NULL,
  p_usuario_id uuid DEFAULT NULL,
  p_observaciones text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_calculo_id uuid;
  v_max_version integer;
BEGIN
  SELECT COALESCE(MAX(c.version_calculo), 0) INTO v_max_version
  FROM erp_calculos_proyecto c
  WHERE c.proyecto_id = p_proyecto_id AND c.tipo_calculo = p_tipo_calculo;

  INSERT INTO erp_calculos_proyecto (
    proyecto_id, tipo_calculo, usuario_id, parametros, resultados,
    version_calculo, origen_calculo, observaciones
  ) VALUES (
    p_proyecto_id, p_tipo_calculo, p_usuario_id, p_parametros, p_resultados,
    v_max_version + 1, 'manual', p_observaciones
  )
  RETURNING id INTO v_calculo_id;

  RETURN v_calculo_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FIX 3: RLS para erp_normativas_departamentales (error 42501)
-- ============================================================

ALTER TABLE IF EXISTS erp_normativas_departamentales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "normativas_departamentales_select" ON erp_normativas_departamentales;
CREATE POLICY "normativas_departamentales_select" ON erp_normativas_departamentales
  FOR SELECT TO authenticated, anon USING (true);

-- Asegurar que la tabla exista
CREATE TABLE IF NOT EXISTS erp_normativas_departamentales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_departamento text NOT NULL,
  nombre_normativa text NOT NULL,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- FIX 4: RLS para tablas de referencia del motor de cálculo
-- ============================================================

-- erp_calculos_proyecto
DROP POLICY IF EXISTS "calculos_proyecto_read_own" ON erp_calculos_proyecto;
CREATE POLICY "calculos_proyecto_read_all" ON erp_calculos_proyecto
  FOR SELECT TO authenticated USING (true);

-- erp_comparaciones_calculos
ALTER TABLE IF EXISTS erp_comparaciones_calculos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comparaciones_select" ON erp_comparaciones_calculos;
CREATE POLICY "comparaciones_select" ON erp_comparaciones_calculos
  FOR SELECT TO authenticated USING (true);

-- erp_dosificaciones_concreto
ALTER TABLE IF EXISTS erp_dosificaciones_concreto ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dosificaciones_select" ON erp_dosificaciones_concreto;
CREATE POLICY "dosificaciones_select" ON erp_dosificaciones_concreto
  FOR SELECT TO authenticated, anon USING (true);

-- erp_parametros_movimiento_tierra
ALTER TABLE IF EXISTS erp_parametros_movimiento_tierra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parametros_mt_select" ON erp_parametros_movimiento_tierra;
CREATE POLICY "parametros_mt_select" ON erp_parametros_movimiento_tierra
  FOR SELECT TO authenticated, anon USING (true);

-- erp_parametros_pavimentos
ALTER TABLE IF EXISTS erp_parametros_pavimentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parametros_pavimentos_select" ON erp_parametros_pavimentos;
CREATE POLICY "parametros_pavimentos_select" ON erp_parametros_pavimentos
  FOR SELECT TO authenticated, anon USING (true);

-- erp_parametros_redes_infraestructura
ALTER TABLE IF EXISTS erp_parametros_redes_infraestructura ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parametros_redes_select" ON erp_parametros_redes_infraestructura;
CREATE POLICY "parametros_redes_select" ON erp_parametros_redes_infraestructura
  FOR SELECT TO authenticated, anon USING (true);

-- erp_parametros_muros_contencion
ALTER TABLE IF EXISTS erp_parametros_muros_contencion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "parametros_muros_select" ON erp_parametros_muros_contencion;
CREATE POLICY "parametros_muros_select" ON erp_parametros_muros_contencion
  FOR SELECT TO authenticated, anon USING (true);

-- erp_subtipologias
ALTER TABLE IF EXISTS erp_subtipologias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subtipologias_select" ON erp_subtipologias;
CREATE POLICY "subtipologias_select" ON erp_subtipologias
  FOR SELECT TO authenticated, anon USING (true);

-- erp_snapshots_estado_calculo
ALTER TABLE IF EXISTS erp_snapshots_estado_calculo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "snapshots_select" ON erp_snapshots_estado_calculo;
CREATE POLICY "snapshots_select" ON erp_snapshots_estado_calculo
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- Verificación
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 072 applied: fixed column ambiguity in obtener_historial_calculos, registrar_calculo params, RLS for motor tables';
END $$;