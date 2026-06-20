-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 5: HISTORIAL DE CÁLCULOS
-- Historial de cálculos para auditoría y trazabilidad
-- Versión: 2026-06-20
-- ============================================================

-- ============================================================
-- 1. TABLA DE HISTORIAL DE CÁLCULOS
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_calculos_proyecto (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyecto_id uuid REFERENCES erp_proyectos(id) ON DELETE CASCADE,
  tipo_calculo text NOT NULL CHECK (tipo_calculo IN ('apu','dosificacion','acero','movimiento_tierra','pavimento','red_infraestructura','muro_contencion','climaticos')),
  fecha_calculo timestamptz DEFAULT now() NOT NULL,
  usuario_id uuid,
  
  -- Parámetros de entrada (JSON)
  parametros jsonb NOT NULL,
  
  -- Resultados (JSON)
  resultados jsonb NOT NULL,
  
  -- Metadatos
  version_calculo integer DEFAULT 1,
  origen_calculo text DEFAULT 'manual', -- 'manual', 'automatico', 'importado'
  observaciones text,
  
  -- Estado de validación
  validado boolean DEFAULT false,
  validado_por uuid,
  fecha_validacion timestamptz,
  notas_validacion text,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calculos_proyecto_proyecto ON erp_calculos_proyecto(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_calculos_proyecto_tipo ON erp_calculos_proyecto(tipo_calculo);
CREATE INDEX IF NOT EXISTS idx_calculos_proyecto_fecha ON erp_calculos_proyecto(fecha_calculo DESC);
CREATE INDEX IF NOT EXISTS idx_calculos_proyecto_usuario ON erp_calculos_proyecto(usuario_id);
CREATE INDEX IF NOT EXISTS idx_calculos_proyecto_validado ON erp_calculos_proyecto(validado);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_calculos_proyecto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calculos_proyecto_read_own" ON erp_calculos_proyecto;
CREATE POLICY "calculos_proyecto_read_own" ON erp_calculos_proyecto FOR SELECT TO authenticated 
USING (
  proyecto_id IN (
    SELECT id FROM erp_proyectos 
    WHERE id = erp_calculos_proyecto.proyecto_id
  )
);

DROP POLICY IF EXISTS "calculos_proyecto_insert_own" ON erp_calculos_proyecto;
CREATE POLICY "calculos_proyecto_insert_own" ON erp_calculos_proyecto FOR INSERT TO authenticated 
WITH CHECK (
  proyecto_id IN (
    SELECT id FROM erp_proyectos 
    WHERE id = erp_calculos_proyecto.proyecto_id
  )
);

DROP POLICY IF EXISTS "calculos_proyecto_update_own" ON erp_calculos_proyecto;
CREATE POLICY "calculos_proyecto_update_own" ON erp_calculos_proyecto FOR UPDATE TO authenticated 
USING (
  proyecto_id IN (
    SELECT id FROM erp_proyectos 
    WHERE id = erp_calculos_proyecto.proyecto_id
  )
);

DROP POLICY IF EXISTS "calculos_proyecto_delete_own" ON erp_calculos_proyecto;
CREATE POLICY "calculos_proyecto_delete_own" ON erp_calculos_proyecto FOR DELETE TO authenticated 
USING (
  proyecto_id IN (
    SELECT id FROM erp_proyectos 
    WHERE id = erp_calculos_proyecto.proyecto_id
  )
);

-- ============================================================
-- 3. TABLA DE COMPARACIONES DE CÁLCULOS
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_comparaciones_calculos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  calculo_base_id uuid REFERENCES erp_calculos_proyecto(id) ON DELETE CASCADE,
  calculo_comparado_id uuid REFERENCES erp_calculos_proyecto(id) ON DELETE CASCADE,
  fecha_comparacion timestamptz DEFAULT now() NOT NULL,
  
  -- Diferencias detectadas (JSON)
  diferencias jsonb NOT NULL,
  
  -- Metadatos de comparación
  tipo_cambio text, -- 'costo_aumento', 'costo_disminucion', 'parametro_cambio', 'resultado_cambio'
  magnitud_cambio numeric(10,2),
  porcentaje_cambio numeric(5,2),
  
  -- Evaluación
  aceptado boolean DEFAULT true,
  motivo_rechazo text,
  
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comparaciones_base ON erp_comparaciones_calculos(calculo_base_id);
CREATE INDEX IF NOT EXISTS idx_comparaciones_comparado ON erp_comparaciones_calculos(calculo_comparado_id);
CREATE INDEX IF NOT EXISTS idx_comparaciones_fecha ON erp_comparaciones_calculos(fecha_comparacion DESC);

-- ============================================================
-- 4. FUNCIÓN PARA REGISTRAR CÁLCULO
-- ============================================================

CREATE OR REPLACE FUNCTION registrar_calculo(
  p_proyecto_id uuid,
  p_tipo_calculo text,
  p_parametros jsonb,
  p_resultados jsonb,
  p_usuario_id uuid DEFAULT NULL,
  p_observaciones text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_calculo_id uuid;
  v_max_version integer;
BEGIN
  -- Obtener versión máxima para este proyecto y tipo
  SELECT COALESCE(MAX(version_calculo), 0) INTO v_max_version
  FROM erp_calculos_proyecto
  WHERE proyecto_id = p_proyecto_id AND tipo_calculo = p_tipo_calculo;
  
  -- Insertar nuevo cálculo
  INSERT INTO erp_calculos_proyecto (
    proyecto_id, 
    tipo_calculo, 
    usuario_id,
    parametros, 
    resultados,
    version_calculo,
    origen_calculo,
    observaciones
  ) VALUES (
    p_proyecto_id,
    p_tipo_calculo,
    p_usuario_id,
    p_parametros,
    p_resultados,
    v_max_version + 1,
    'manual',
    p_observaciones
  )
  RETURNING id INTO v_calculo_id;
  
  RETURN v_calculo_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FUNCIÓN PARA OBTENER HISTORIAL DE CÁLCULOS
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_historial_calculos(
  p_proyecto_id uuid,
  p_tipo_calculo text DEFAULT NULL
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
    id,
    tipo_calculo,
    fecha_calculo,
    version_calculo,
    origen_calculo,
    parametros,
    resultados,
    validado
  FROM erp_calculos_proyecto
  WHERE proyecto_id = p_proyecto_id
    AND (p_tipo_calculo IS NULL OR tipo_calculo = p_tipo_calculo)
  ORDER BY fecha_calculo DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. FUNCIÓN PARA COMPARAR DOS CÁLCULOS
-- ============================================================

CREATE OR REPLACE FUNCTION comparar_calculos(
  p_calculo_id_1 uuid,
  p_calculo_id_2 uuid
)
RETURNS TABLE(
  campo text,
  valor_1 text,
  valor_2 text,
  tipo_diferencia text, -- 'igual', 'diferente', 'agregado', 'eliminado'
  porcentaje_diferencia numeric
) AS $$
DECLARE
  v_calc1 RECORD;
  v_calc2 RECORD;
  v_diferencia jsonb;
BEGIN
  -- Obtener los dos cálculos
  SELECT * INTO v_calc1 FROM erp_calculos_proyecto WHERE id = p_calculo_id_1;
  SELECT * INTO v_calc2 FROM erp_calculos_proyecto WHERE id = p_calculo_id_2;
  
  -- Si los tipos son diferentes, no se pueden comparar
  IF v_calc1.tipo_calculo != v_calc2.tipo_calculo THEN
    RETURN;
  END IF;
  
  -- Comparar parámetros (simplificado - comparación JSON completa sería más compleja)
  -- Aquí implementamos comparación básica de resultados
  RETURN QUERY
  SELECT 
    'costo_total' as campo,
    (v_calc1.resultados->>'costo_total')::text as valor_1,
    (v_calc2.resultados->>'costo_total')::text as valor_2,
    CASE 
      WHEN (v_calc1.resultados->>'costo_total')::numeric = (v_calc2.resultados->>'costo_total')::numeric THEN 'igual'
      WHEN (v_calc1.resultados->>'costo_total')::numeric > (v_calc2.resultados->>'costo_total')::numeric THEN 'disminucion'
      ELSE 'aumento'
    END as tipo_diferencia,
    CASE 
      WHEN (v_calc1.resultados->>'costo_total')::numeric = (v_calc2.resultados->>'costo_total')::numeric THEN 0
      WHEN (v_calc1.resultados->>'costo_total')::numeric = 0 THEN NULL
      ELSE ((v_calc2.resultados->>'costo_total')::numeric - (v_calc1.resultados->>'costo_total')::numeric) / (v_calc1.resultados->>'costo_total')::numeric * 100
    END as porcentaje_diferencia;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. TRIGGER DE ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_calculos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_calculos ON erp_calculos_proyecto;
CREATE TRIGGER trigger_actualizar_calculos
BEFORE UPDATE ON erp_calculos_proyecto
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_calculos();

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT 'Tabla calculos_proyecto' as componente, COUNT(*) as total FROM erp_calculos_proyecto
UNION ALL
SELECT 'Tabla comparaciones_calculos', COUNT(*) FROM erp_comparaciones_calculos
UNION ALL
SELECT 'Función registrar_calculo', 1 FROM pg_proc WHERE proname = 'registrar_calculo'
UNION ALL
SELECT 'Función obtener_historial_calculos', 1 FROM pg_proc WHERE proname = 'obtener_historial_calculos'
UNION ALL
SELECT 'Función comparar_calculos', 1 FROM pg_proc WHERE proname = 'comparar_calculos';