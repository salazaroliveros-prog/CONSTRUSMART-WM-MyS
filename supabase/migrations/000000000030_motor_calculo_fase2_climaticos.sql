-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 2: PARÁMETROS CLIMÁTICOS
-- 22 departamentos con datos climáticos detallados
-- Versión: 2026-06-19
-- ============================================================

-- ============================================================
-- 1. TABLA DE PARÁMETROS CLIMÁTICOS POR DEPARTAMENTO
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_parametros_climaticos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  departamento_codigo text NOT NULL REFERENCES erp_departamentos_gt(codigo),
  zona_climatica text NOT NULL CHECK (zona_climatica IN ('1','2','3','4','5','6','7','8','9','10','11','12','13','14')),
  altitud_min_msnm numeric(6,2) NOT NULL,
  altitud_max_msnm numeric(6,2) NOT NULL,
  temperatura_min_c numeric(4,1) NOT NULL,
  temperatura_max_c numeric(4,1) NOT NULL,
  humedad_relativa_promedio_pct numeric(5,2) NOT NULL,
  precipitacion_promedio_mm_mes numeric(7,1) NOT NULL,
  viento_promedio_kmh numeric(5,1) NOT NULL,
  factor_curado_concreto numeric(4,2) NOT NULL,
  factor_rendimiento_mo numeric(4,2) NOT NULL,
  factor_proteccion_encofrados numeric(4,2) NOT NULL,
  estacion_critica text NOT NULL CHECK (estacion_critica IN ('lluviosa','seca','ninguna')),
  meses_criticos text[],
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_parametros_climaticos_departamento ON erp_parametros_climaticos(departamento_codigo);
CREATE INDEX idx_parametros_climaticos_activas ON erp_parametros_climaticos(activo);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_parametros_climaticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parametros_climaticos_read_all" ON erp_parametros_climaticos FOR SELECT TO authenticated USING (activo = true);

-- ============================================================
-- 3. INSERTAR PARÁMETROS CLIMÁTICOS PARA 22 DEPARTAMENTOS
-- Basados en datos INSIVUMEH y AGIES
-- ============================================================

INSERT INTO erp_parametros_climaticos (departamento_codigo, zona_climatica, altitud_min_msnm, altitud_max_msnm, temperatura_min_c, temperatura_max_c, humedad_relativa_promedio_pct, precipitacion_promedio_mm_mes, viento_promedio_kmh, factor_curado_concreto, factor_rendimiento_mo, factor_proteccion_encofrados, estacion_critica, meses_criticos, observaciones) VALUES
('GT-01', '5', 1200, 2000, 12, 28, 70, 100, 15, 1.0, 1.0, 1.0, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Departamento Guatemala, clima templado moderado'),
('GT-02', '1', 300, 500, 22, 35, 80, 208, 12, 0.95, 1.05, 1.0, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Escuintla, clima cálido húmedo, zona costera'),
('GT-03', '1', 100, 300, 22, 32, 85, 350, 10, 0.95, 0.95, 1.05, 'lluviosa', ARRAY['junio','julio','agosto','septiembre','octubre','noviembre'], 'Izabal, clima tropical húmedo, alta pluviosidad'),
('GT-04', '6', 400, 900, 18, 32, 55, 67, 20, 1.05, 0.95, 1.0, 'seca', ARRAY['noviembre','diciembre','enero','febrero','marzo','abril'], 'Chiquimula, clima seco oriental, valle'),
('GT-05', '4', 700, 1100, 18, 28, 65, 150, 18, 1.0, 0.98, 1.05, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Santa Rosa, clima templado cálido'),
('GT-06', '9', 2000, 2800, 8, 22, 60, 83, 20, 1.35, 0.88, 1.2, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Sololá, clima frío altiplano'),
('GT-07', '9', 2100, 2500, 7, 21, 58, 75, 22, 1.40, 0.85, 1.25, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Totonicapán, clima muy frío altiplano'),
('GT-08', '9', 2000, 3000, 5, 24, 60, 83, 30, 1.45, 0.88, 1.3, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Quetzaltenango, clima frío con vientos fuertes'),
('GT-09', '2', 300, 600, 22, 32, 75, 233, 15, 0.95, 1.02, 1.0, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Suchitepéquez, clima cálido húmedo tropical'),
('GT-10', '2', 200, 500, 24, 34, 78, 250, 14, 0.93, 1.03, 1.0, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Retalhuleu, clima cálido húmedo costero'),
('GT-11', '8', 2000, 2800, 10, 24, 55, 125, 25, 1.35, 0.85, 1.25, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'San Marcos, clima frío altiplano occidental'),
('GT-12', '8', 1500, 3200, 3, 24, 55, 67, 35, 1.50, 0.82, 1.35, 'seca', ARRAY['noviembre','diciembre','enero','febrero','marzo','abril'], 'Huehuetenango, clima muy frío con vientos extremos'),
('GT-13', '4', 300, 600, 20, 30, 60, 100, 20, 1.0, 0.98, 1.05, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'El Progreso, clima semiárido oriental'),
('GT-14', '7', 900, 1500, 15, 26, 70, 150, 18, 1.1, 0.95, 1.1, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Baja Verapaz, clima templado húmedo'),
('GT-15', '7', 1000, 2000, 16, 28, 85, 183, 15, 1.15, 0.92, 1.1, 'lluviosa', ARRAY['junio','julio','agosto','septiembre','octubre','noviembre'], 'Alta Verapaz, clima muy húmedo boscoso'),
('GT-16', '3', 100, 300, 22, 34, 80, 150, 12, 0.90, 0.95, 1.0, 'lluviosa', ARRAY['junio','julio','agosto','septiembre','octubre'], 'Petén, clima tropical cálido selva'),
('GT-17', '1', 100, 300, 22, 32, 85, 350, 10, 0.95, 0.95, 1.05, 'lluviosa', ARRAY['junio','julio','agosto','septiembre','octubre','noviembre'], 'Izabal, clima caribeño húmedo'),
('GT-18', '6', 1500, 2600, 12, 26, 60, 100, 22, 1.2, 0.92, 1.15, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Quiché, clima templado-frío altiplano'),
('GT-19', '6', 1500, 2200, 14, 26, 62, 83, 18, 1.1, 0.94, 1.1, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Chimaltenango, clima templado'),
('GT-20', '6', 1400, 2000, 14, 26, 65, 92, 16, 1.05, 0.95, 1.05, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Sacatepéquez, clima templado volcánico'),
('GT-21', '4', 300, 800, 18, 30, 55, 75, 22, 1.05, 0.95, 1.0, 'seca', ARRAY['noviembre','diciembre','enero','febrero','marzo','abril'], 'Jutiapa, clima seco oriental'),
('GT-22', '6', 1200, 1800, 16, 26, 60, 83, 18, 1.1, 0.94, 1.1, 'lluviosa', ARRAY['mayo','junio','julio','agosto','septiembre','octubre'], 'Jalapa, clima templado oriental');

-- ============================================================
-- 4. FUNCIÓN PARA OBTENER FACTOR DE CURADO POR DEPARTAMENTO Y MES
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_factor_curado_climatico(
  p_departamento_codigo text,
  p_mes text DEFAULT NULL
)
RETURNS TABLE(
  factor_curado numeric,
  factor_rendimiento numeric,
  factor_proteccion numeric,
  factor_ajuste_estacional numeric,
  observaciones text
) AS $$
DECLARE
  v_clima RECORD;
  v_factor_ajuste numeric := 1.0;
  v_mes_lower text;
BEGIN
  -- Obtener parámetros climáticos del departamento
  SELECT * INTO v_clima
  FROM erp_parametros_climaticos
  WHERE departamento_codigo = p_departamento_codigo
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    -- Si no se encuentra, retornar valores por defecto
    RETURN QUERY SELECT 1.0, 1.0, 1.0, 1.0, 'Parámetros climáticos no encontrados, usando valores por defecto';
    RETURN;
  END IF;

  -- Ajuste por estación si se especifica mes
  IF p_mes IS NOT NULL THEN
    v_mes_lower := LOWER(p_mes);
    
    -- Verificar si el mes es crítico para el departamento
    IF v_mes_lower = ANY(v_clima.meses_criticos) THEN
      IF v_clima.estacion_critica = 'lluviosa' THEN
        v_factor_ajuste := 1.2;
      ELSIF v_clima.estacion_critica = 'seca' THEN
        v_factor_ajuste := 1.1;
      END IF;
    END IF;
  END IF;

  -- Retornar factores calculados
  RETURN QUERY
  SELECT
    v_clima.factor_curado_concreto * v_factor_ajuste as factor_curado,
    v_clima.factor_rendimiento_mo / v_factor_ajuste as factor_rendimiento,
    v_clima.factor_proteccion_encofrados as factor_proteccion,
    v_factor_ajuste as factor_ajuste_estacional,
    'Factores climáticos ajustados por ' || COALESCE(p_mes, 'sin especificar mes') as observaciones;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FUNCIÓN PARA OBTENER PARÁMETROS CLIMÁTICOS POR DEPARTAMENTO
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_parametros_climaticos(p_departamento_codigo text)
RETURNS TABLE(
  zona_climatica text,
  altitud_min_msnm numeric,
  altitud_max_msnm numeric,
  temperatura_min_c numeric,
  temperatura_max_c numeric,
  humedad_relativa_promedio_pct numeric,
  precipitacion_promedio_mm_mes numeric,
  viento_promedio_kmh numeric,
  factor_curado_concreto numeric,
  factor_rendimiento_mo numeric,
  factor_proteccion_encofrados numeric,
  estacion_critica text,
  meses_criticos text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    zona_climatica,
    altitud_min_msnm,
    altitud_max_msnm,
    temperatura_min_c,
    temperatura_max_c,
    humedad_relativa_promedio_pct,
    precipitacion_promedio_mm_mes,
    viento_promedio_kmh,
    factor_curado_concreto,
    factor_rendimiento_mo,
    factor_proteccion_encofrados,
    estacion_critica,
    meses_criticos
  FROM erp_parametros_climaticos
  WHERE departamento_codigo = p_departamento_codigo
    AND activo = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. FUNCIÓN PARA OBTENER FACTOR DE AJUSTE POR TEMPERATURA
-- Basada en temperatura promedio del departamento
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_factor_temperatura_departamento(p_departamento_codigo text)
RETURNS numeric AS $$
DECLARE
  v_clima RECORD;
  v_factor numeric := 1.0;
BEGIN
  SELECT * INTO v_clima
  FROM erp_parametros_climaticos
  WHERE departamento_codigo = p_departamento_codigo
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 1.0;
  END IF;

  -- Calcular factor basado en temperatura promedio
  v_factor := (v_clima.temperatura_min_c + v_clima.temperatura_max_c) / 2 / 20;
  
  -- Limitar factor entre 0.85 y 1.15
  IF v_factor < 0.85 THEN v_factor := 0.85; END IF;
  IF v_factor > 1.15 THEN v_factor := 1.15; END IF;
  
  RETURN v_factor;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. FUNCIÓN PARA OBTENER FACTOR DE AJUSTE POR HUMEDAD
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_factor_humedad_departamento(p_departamento_codigo text)
RETURNS numeric AS $$
DECLARE
  v_clima RECORD;
  v_factor numeric := 1.0;
BEGIN
  SELECT * INTO v_clima
  FROM erp_parametros_climaticos
  WHERE departamento_codigo = p_departamento_codigo
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 1.0;
  END IF;

  -- Ajuste por humedad relativa
  IF v_clima.humedad_relativa_promedio_pct > 80 THEN
    v_factor := 0.95;
  ELSIF v_clima.humedad_relativa_promedio_pct < 50 THEN
    v_factor := 1.05;
  ELSE
    v_factor := 1.0;
  END IF;
  
  RETURN v_factor;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_parametros_climaticos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_parametros_climaticos
BEFORE UPDATE ON erp_parametros_climaticos
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_parametros_climaticos();
