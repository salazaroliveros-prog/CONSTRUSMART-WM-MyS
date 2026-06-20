-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 4 - AT-03
-- SISTEMA DE ESTACIONALIDAD
-- ============================================================

-- Tabla de estacionalidad por departamento y mes
CREATE TABLE IF NOT EXISTS erp_estacionalidad (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  departamento_codigo text NOT NULL CHECK (departamento_codigo IN ('GT-01','GT-02','GT-03','GT-04','GT-05','GT-06','GT-07','GT-08','GT-09','GT-10','GT-11','GT-12','GT-13','GT-14','GT-15','GT-16','GT-17','GT-18','GT-19','GT-20','GT-21','GT-22')),
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  
  -- Factores de estacionalidad
  factor_disponibilidad numeric(5,3) NOT NULL DEFAULT 1.0, -- disponibilidad de materiales y mano de obra
  factor_costo numeric(5,3) NOT NULL DEFAULT 1.0, -- ajuste de costos por estacionalidad
  factor_productividad numeric(5,3) NOT NULL DEFAULT 1.0, -- productividad de cuadrillas
  factor_rango datetime numeric(5,3) DEFAULT 1.0, -- ajuste por condiciones climáticas extremas
  
  -- Clasificación del mes
  temporada text CHECK (temporada IN ('seca','lluviosa','transicion_seca','transicion_lluviosa')),
  condiciones_climaticas text, -- descripción de condiciones típicas
  
  -- Restricciones específicas
  restricciones_especiales text[], -- actividades restringidas en este mes
  riesgos_estacionales text[], -- riesgos específicos del mes
  
  -- Metadatos
  justificacion_tecnica text,
  referencia_historica text,
  activo boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT unique_departamento_mes UNIQUE (departamento_codigo, mes)
);

-- Índices
CREATE INDEX idx_estacionalidad_departamento ON erp_estacionalidad(departamento_codigo);
CREATE INDEX idx_estacionalidad_mes ON erp_estacionalidad(mes);
CREATE INDEX idx_estacionalidad_temporada ON erp_estacionalidad(temporada);
CREATE INDEX idx_estacionalidad_activo ON erp_estacionalidad(activo);
CREATE INDEX idx_estacionalidad_departamento_mes ON erp_estacionalidad(departamento_codigo, mes);

-- Tabla de ajustes estacionales por tipo de actividad
CREATE TABLE IF NOT EXISTS erp_ajustes_estacionales_actividad (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  estacionalidad_id uuid NOT NULL REFERENCES erp_estacionalidad(id),
  tipo_actividad text NOT NULL CHECK (tipo_actividad IN ('cimentacion','estructura','mamposteria','acabados','instalaciones','movimiento_tierra','pavimentacion','general')),
  
  -- Factores específicos por tipo de actividad
  factor_especifico numeric(5,3) NOT NULL DEFAULT 1.0,
  impacto_duracion integer, -- días adicionales o reducción por estacionalidad
  
  -- Recomendaciones específicas
  recomendaciones text[],
  medidas_mitigacion text[],
  
  activo boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_ajustes_estacionalidad ON erp_ajustes_estacionales_actividad(estacionalidad_id);
CREATE INDEX idx_ajustes_actividad ON erp_ajustes_estacionales_actividad(tipo_actividad);

-- Función para obtener factores estacionales
CREATE OR REPLACE FUNCTION obtener_factores_estacionales(
  p_departamento_codigo text,
  p_mes integer,
  p_tipo_actividad text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  departamento_codigo text,
  mes integer,
  temporada text,
  factor_disponibilidad numeric,
  factor_costo numeric,
  factor_productividad numeric,
  factor_especifico numeric,
  condiciones_climaticas text,
  restricciones_especiales text[],
  riesgos_estacionales text[]
) AS $$
DECLARE
  v_estacionalidad RECORD;
  v_factor_especifico numeric DEFAULT 1.0;
BEGIN
  -- Obtener estacionalidad base
  SELECT * INTO v_estacionalidad FROM erp_estacionalidad
  WHERE departamento_codigo = p_departamento_codigo
    AND mes = p_mes
    AND activo = true;
  
  -- Si no hay registro, usar valores por defecto
  IF v_estacionalidad IS NULL THEN
    RETURN QUERY SELECT 
      NULL, p_departamento_codigo, p_mes, 'transicion'::text,
      1.0::numeric, 1.0::numeric, 1.0::numeric, 1.0::numeric,
      'Sin datos específicos'::text, NULL::text[], NULL::text[];
    RETURN;
  END IF;
  
  -- Obtener factor específico por actividad si se especifica
  IF p_tipo_actividad IS NOT NULL THEN
    SELECT factor_especifico INTO v_factor_especifico
    FROM erp_ajustes_estacionales_actividad
    WHERE estacionalidad_id = v_estacionalidad.id
      AND tipo_actividad = p_tipo_actividad
      AND activo = true
    LIMIT 1;
    
    IF v_factor_especifico IS NULL THEN
      v_factor_especifico := 1.0;
    END IF;
  END IF;
  
  RETURN QUERY SELECT 
    v_estacionalidad.id, v_estacionalidad.departamento_codigo, v_estacionalidad.mes,
    v_estacionalidad.temporada, v_estacionalidad.factor_disponibilidad, 
    v_estacionalidad.factor_costo, v_estacionalidad.factor_productividad, 
    v_factor_especifico, v_estacionalidad.condiciones_climaticas,
    v_estacionalidad.restricciones_especiales, v_estacionalidad.riesgos_estacionales;
END;
$$ LANGUAGE plpgsql;

-- Función para aplicar factores estacionales a un costo
CREATE OR REPLACE FUNCTION aplicar_factores_estacionales(
  p_costo_base numeric,
  p_departamento_codigo text,
  p_mes integer,
  p_tipo_actividad text DEFAULT NULL
)
RETURNS TABLE(
  costo_ajustado numeric,
  factor_disponibilidad numeric,
  factor_costo numeric,
  factor_productividad numeric,
  factor_especifico numeric,
  factor_total numeric,
  diferencia_costo numeric,
  porcentaje_ajuste numeric,
  temporada text,
  condiciones_climaticas text
) AS $$
DECLARE
  v_factores RECORD;
  v_costo_ajustado numeric;
  v_factor_total numeric;
BEGIN
  -- Obtener factores estacionales
  SELECT * INTO v_factores FROM obtener_factores_estacionales(
    p_departamento_codigo, p_mes, p_tipo_actividad
  );
  
  -- Calcular factor total
  v_factor_total := v_factores.factor_disponibilidad * v_factores.factor_costo * 
                    v_factores.factor_productividad * v_factores.factor_especifico;
  
  -- Aplicar factor
  v_costo_ajustado := p_costo_base * v_factor_total;
  
  RETURN QUERY SELECT 
    v_costo_ajustado, v_factores.factor_disponibilidad, v_factores.factor_costo,
    v_factores.factor_productividad, v_factores.factor_especifico, v_factor_total,
    v_costo_ajustado - p_costo_base,
    ((v_costo_ajustado - p_costo_base) / p_costo_base) * 100,
    v_factores.temporada, v_factores.condiciones_climaticas;
END;
$$ LANGUAGE plpgsql;

-- Seed data: Estacionalidad para departamentos principales de Guatemala
INSERT INTO erp_estacionalidad (departamento_codigo, mes, factor_disponibilidad, factor_costo, factor_productividad, temporada, condiciones_climaticas, restricciones_especiales, riesgos_estacionales, justificacion_tecnica, activo) VALUES
-- Guatemala (GT-01) - Clima moderado con lluvias mayo-octubre
('GT-01', 1, 1.0, 1.0, 1.0, 'seca', 'Seco, fresco', NULL, ARRAY[]::text[], 'Temporada seca, condiciones óptimas', true),
('GT-01', 2, 1.0, 1.0, 1.0, 'seca', 'Seco, primavera', NULL, ARRAY[]::text[], 'Transición a lluvias, aún seco', true),
('GT-01', 3, 1.0, 1.0, 1.0, 'seca', 'Cálido, seco', NULL, ARRAY[]::text[], 'Inicio temporada seca', true),
('GT-01', 4, 1.0, 1.0, 1.0, 'transicion_seca', 'Inicio lluvias', NULL, ARRAY[]::text[], 'Inicio temporada de lluvias', true),
('GT-01', 5, 0.95, 1.05, 0.90, 'lluviosa', 'Lluvias moderadas', ARRAY[]::text[], ARRAY['viento fuerte'], 'Lluvias moderadas, reducción productividad', true),
('GT-01', 6, 0.90, 1.10, 0.85, 'lluviosa', 'Lluvias fuertes', ARRAY['acabados exteriores'], ARRAY['inundaciones', 'deslizamientos'], 'Lluvias fuertes, restricciones actividades', true),
('GT-01', 7, 0.88, 1.12, 0.82, 'lluviosa', 'Lluvias intensas', ARRAY['movimiento tierra', 'acabados exteriores'], ARRAY['inundaciones', 'deslizamientos', 'viento'], 'Pico de lluvias, mínima productividad', true),
('GT-01', 8, 0.90, 1.10, 0.85, 'lluviosa', 'Lluvias fuertes', ARRAY['movimiento tierra'], ARRAY['inundaciones'], 'Lluvias fuertes, recuperación gradual', true),
('GT-01', 9, 0.95, 1.05, 0.90, 'lluviosa', 'Lluvias moderadas', NULL, ARRAY[]::text[], 'Reducción de lluvias', true),
('GT-01', 10, 1.0, 1.0, 1.0, 'transicion_lluviosa', 'Fin lluvias', NULL, ARRAY[]::text[], 'Fin temporada lluviosa', true),
('GT-01', 11, 1.0, 1.0, 1.0, 'seca', 'Seco, otoño', NULL, ARRAY[]::text[], 'Temporada seca', true),
('GT-01', 12, 1.0, 1.0, 1.0, 'seca', 'Seco, fresco', NULL, ARRAY[]::text[], 'Temporada seca, condiciones óptimas', true),

-- Quetzaltenango (GT-09) - Clima frío, lluvias mayo-octubre
('GT-09', 1, 0.95, 1.05, 0.95, 'seca', 'Frío, seco', NULL, ARRAY['congelamiento superficial'], 'Clima frío reduce productividad', true),
('GT-09', 2, 0.95, 1.05, 0.95, 'seca', 'Frío, seco', NULL, ARRAY[]::text[], 'Clima frío persiste', true),
('GT-09', 3, 1.0, 1.0, 1.0, 'seca', 'Templado, seco', NULL, ARRAY[]::text[], 'Mejora condiciones climáticas', true),
('GT-09', 4, 1.0, 1.0, 1.0, 'transicion_seca', 'Inicio lluvias', NULL, ARRAY[]::text[], 'Inicio lluvias', true),
('GT-09', 5, 0.92, 1.08, 0.88, 'lluviosa', 'Lluvias moderadas, frío', ARRAY[]::text[], ARRAY['heladas'], 'Lluvias + frío reducen productividad', true),
('GT-09', 6, 0.85, 1.15, 0.80, 'lluviosa', 'Lluvias fuertes, frío', ARRAY['acabados exteriores', 'movimiento tierra'], ARRAY['heladas', 'deslizamientos'], 'Lluvias intensas + frío', true),
('GT-09', 7, 0.82, 1.18, 0.75, 'lluviosa', 'Lluvias muy fuertes, muy frío', ARRAY['concreto', 'acabados', 'movimiento tierra'], ARRAY['heladas severas', 'deslizamientos'], 'Pico lluvias + frío extremo', true),
('GT-09', 8, 0.85, 1.15, 0.80, 'lluviosa', 'Lluvias fuertes, frío', ARRAY['concreto', 'movimiento tierra'], ARRAY['heladas'], 'Lluvias fuertes', true),
('GT-09', 9, 0.90, 1.10, 0.85, 'lluviosa', 'Lluvias moderadas', ARRAY[]::text[], ARRAY[]::text[], 'Reducción gradual lluvias', true),
('GT-09', 10, 0.95, 1.05, 0.92, 'transicion_lluviosa', 'Fin lluvias, frío', NULL, ARRAY['heladas'], 'Fin lluvias, frío retorna', true),
('GT-09', 11, 0.90, 1.10, 0.88, 'seca', 'Frío', NULL, ARRAY['heladas'], 'Clima frío persiste', true),
('GT-09', 12, 0.95, 1.05, 0.92, 'seca', 'Frío, seco', NULL, ARRAY['heladas'], 'Clima frío seco', true),

-- Escuintla (GT-05) - Clima caliente, lluvias mayo-octubre
('GT-05', 1, 1.0, 1.0, 1.0, 'seca', 'Caluroso, seco', NULL, ARRAY['deshidratación'], 'Clima caliente seco', true),
('GT-05', 2, 1.0, 1.0, 1.0, 'seca', 'Muy caluroso', NULL, ARRAY['deshidratación', 'insolación'], 'Temperaturas máximas', true),
('GT-05', 3, 1.0, 1.0, 1.0, 'seca', 'Caluroso, seco', NULL, ARRAY[]::text[], 'Clima caliente seco', true),
('GT-05', 4, 1.0, 1.0, 1.0, 'transicion_seca', 'Inicio lluvias, calor', NULL, ARRAY[]::text[], 'Inicio lluvias', true),
('GT-05', 5, 0.95, 1.05, 0.90, 'lluviosa', 'Lluvias, calor', ARRAY[]::text[], ARRAY['inundaciones'], 'Lluvias + calor', true),
('GT-05', 6, 0.88, 1.12, 0.85, 'lluviosa', 'Lluvias fuertes, calor', ARRAY['acabados exteriores'], ARRAY['inundaciones', 'tormentas'], 'Pico lluvias + calor', true),
('GT-05', 7, 0.85, 1.15, 0.80, 'lluviosa', 'Lluvias muy fuertes', ARRAY['movimiento tierra', 'acabados exteriores'], ARRAY['inundaciones', 'tormentas eléctricas'], 'Pico lluvias intensas', true),
('GT-05', 8, 0.88, 1.12, 0.85, 'lluviosa', 'Lluvias fuertes', ARRAY['movimiento tierra'], ARRAY['inundaciones'], 'Lluvias fuertes', true),
('GT-05', 9, 0.92, 1.08, 0.88, 'lluviosa', 'Lluvias moderadas', NULL, ARRAY[]::text[], 'Reducción lluvias', true),
('GT-05', 10, 0.95, 1.05, 0.92, 'transicion_lluviosa', 'Fin lluvias, calor', NULL, ARRAY[]::text[], 'Fin lluvias, calor retorna', true),
('GT-05', 11, 1.0, 1.0, 1.0, 'seca', 'Caluroso', NULL, ARRAY[]::text[], 'Clima caliente', true),
('GT-05', 12, 1.0, 1.0, 1.0, 'seca', 'Caluroso, seco', NULL, ARRAY[]::text[], 'Clima caliente seco', true),

-- Sololá (GT-07) - Clima frío volcánico, lluvias mayo-octubre
('GT-07', 1, 0.90, 1.10, 0.88, 'seca', 'Muy frío', NULL, ARRAY['heladas', 'niebla'], 'Clima muy frío', true),
('GT-07', 2, 0.90, 1.10, 0.88, 'seca', 'Muy frío', NULL, ARRAY['heladas'], 'Clima muy frío persiste', true),
('GT-07', 3, 0.95, 1.05, 0.92, 'seca', 'Frío', NULL, ARRAY['heladas'], 'Clima frío mejora', true),
('GT-07', 4, 1.0, 1.0, 1.0, 'transicion_seca', 'Inicio lluvias', NULL, ARRAY[]::text[], 'Inicio lluvias', true),
('GT-07', 5, 0.88, 1.12, 0.85, 'lluviosa', 'Lluvias, frío', NULL, ARRAY['heladas', 'niebla'], 'Lluvias + frío + niebla', true),
('GT-07', 6, 0.80, 1.20, 0.75, 'lluviosa', 'Lluvias fuertes, frío', ARRAY['acabados exteriores', 'movimiento tierra'], ARRAY['heladas', 'deslizamientos volcánicos'], 'Lluvias intensas + frío extremo', true),
('GT-07', 7, 0.78, 1.22, 0.72, 'lluviosa', 'Lluvias muy fuertes, muy frío', ARRAY['concreto', 'acabados', 'movimiento tierra'], ARRAY['heladas severas', 'deslizamientos'], 'Pico lluvias + frío extremo', true),
('GT-07', 8, 0.80, 1.20, 0.75, 'lluviosa', 'Lluvias fuertes, frío', ARRAY['concreto', 'movimiento tierra'], ARRAY['heladas'], 'Lluvias fuertes', true),
('GT-07', 9, 0.85, 1.15, 0.82, 'lluviosa', 'Lluvias moderadas', NULL, ARRAY['heladas'], 'Reducción lluvias', true),
('GT-07', 10, 0.90, 1.10, 0.88, 'transicion_lluviosa', 'Fin lluvias, frío', NULL, ARRAY['heladas'], 'Fin lluvias, frío', true),
('GT-07', 11, 0.88, 1.12, 0.85, 'seca', 'Muy frío', NULL, ARRAY['heladas', 'niebla'], 'Clima muy frío retorna', true),
('GT-07', 12, 0.90, 1.10, 0.88, 'seca', 'Muy frío', NULL, ARRAY['heladas'], 'Clima muy frío', true);

-- Seed data: Ajustes estacionales por tipo de actividad
INSERT INTO erp_ajustes_estacionales_actividad (estacionalidad_id, tipo_actividad, factor_especifico, impacto_duracion, recomendaciones, medidas_mitigacion, activo) 
SELECT 
  e.id,
  unnest(ARRAY['cimentacion','estructura','mamposteria','acabados','instalaciones','movimiento_tierra','pavimentacion','general']::text[]),
  CASE 
    WHEN e.temporada = 'lluviosa' THEN 
      CASE tipo_actividad
        WHEN 'movimiento_tierra' THEN 1.25
        WHEN 'acabados' THEN 1.20
        WHEN 'pavimentacion' THEN 1.18
        WHEN 'mamposteria' THEN 1.15
        WHEN 'cimentacion' THEN 1.10
        ELSE 1.05
      END
    WHEN e.temporada = 'transicion_seca' OR e.temporada = 'transicion_lluviosa' THEN 1.03
    ELSE 1.0
  END,
  CASE 
    WHEN e.temporada = 'lluviosa' THEN 
      CASE tipo_actividad
        WHEN 'movimiento_tierra' THEN 7
        WHEN 'acabados' THEN 5
        WHEN 'pavimentacion' THEN 5
        WHEN 'mamposteria' THEN 3
        WHEN 'cimentacion' THEN 2
        ELSE 0
      END
    ELSE 0
  END,
  CASE 
    WHEN e.temporada = 'lluviosa' THEN ARRAY['Programar actividades interiores', 'Cubrir materiales', 'Monitorear pronóstico', 'Tener plan de contingencia']
    WHEN e.temporada = 'seca' AND e.departamento_codigo IN ('GT-09','GT-07') THEN ARRAY['Proteger contra heladas', 'Programar curado especial', 'Monitorear temperaturas']
    ELSE ARRAY[]::text[]
  END,
  CASE 
    WHEN e.temporada = 'lluviosa' THEN ARRAY['Toldos y cubiertas', 'Drenaje temporal', 'Bombas de achique', 'Lona impermeable']
    WHEN e.temporada = 'seca' AND e.departamento_codigo IN ('GT-09','GT-07') THEN ARRAY['Abrasivos térmicos', 'Membranas antiheladas', 'Cubiertas nocturnas']
    ELSE ARRAY[]::text[]
  END,
  true
FROM erp_estacionalidad e
CROSS JOIN (SELECT unnest(ARRAY['cimentacion','estructura','mamposteria','acabados','instalaciones','movimiento_tierra','pavimentacion','general']::text[]) as tipo_actividad) t
WHERE e.activo = true;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION actualizar_updated_at_estacionalidad()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_updated_at_estacionalidad
  BEFORE UPDATE ON erp_estacionalidad
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_estacionalidad();

CREATE TRIGGER trigger_actualizar_updated_at_ajustes
  BEFORE UPDATE ON erp_ajustes_estacionales_actividad
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_updated_at_estacionalidad();

-- RLS Policies
ALTER TABLE erp_estacionalidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_ajustes_estacionales_actividad ENABLE ROW LEVEL SECURITY;

-- Policies para estacionalidad
CREATE POLICY "estacionalidad_lectura_autenticados" 
  ON erp_estacionalidad FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "estacionalidad_escritura_autenticados" 
  ON erp_estacionalidad FOR ALL 
  USING (auth.role() = 'authenticated');

-- Policies para ajustes estacionales
CREATE POLICY "ajustes_lectura_autenticados" 
  ON erp_ajustes_estacionales_actividad FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "ajustes_escritura_autenticados" 
  ON erp_ajustes_estacionales_actividad FOR ALL 
  USING (auth.role() = 'authenticated');

-- Comentarios de documentación
COMMENT ON TABLE erp_estacionalidad IS 'Factores de estacionalidad por departamento y mes para ajustes climáticos en Guatemala';
COMMENT ON TABLE erp_ajustes_estacionales_actividad IS 'Ajustes estacionales específicos por tipo de actividad constructiva';
COMMENT ON FUNCTION obtener_factores_estacionales IS 'Función para obtener factores estacionales según departamento, mes y tipo de actividad';
COMMENT ON FUNCTION aplicar_factores_estacionales IS 'Función para aplicar factores estacionales a costos de proyecto';