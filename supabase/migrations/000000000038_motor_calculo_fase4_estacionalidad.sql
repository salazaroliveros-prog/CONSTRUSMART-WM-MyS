-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 4: ESTACIONALIDAD
-- Sistema de factores estacionales por departamento y mes
-- Versión: 2026-06-20
-- ============================================================

-- ============================================================
-- 1. TABLA DE ESTACIONALIDAD
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_estacionalidad (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  departamento_codigo text NOT NULL CHECK (departamento_codigo IN ('GT-01','GT-02','GT-03','GT-04','GT-05','GT-06','GT-07','GT-07','GT-08','GT-09','GT-10','GT-11','GT-12','GT-13','GT-14','GT-15','GT-16','GT-17','GT-18','GT-19','GT-20','GT-21','GT-22')),
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  factor_disponibilidad numeric(5,3) NOT NULL, -- Factor de disponibilidad de mano de obra
  factor_costo numeric(5,3) NOT NULL, -- Factor de costo estacional
  factor_productividad numeric(5,3) NOT NULL, -- Factor de productividad
  condiciones_especiales text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estacionalidad_combo ON erp_estacionalidad(departamento_codigo, mes);
CREATE INDEX IF NOT EXISTS idx_estacionalidad_activas ON erp_estacionalidad(activo);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_estacionalidad ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "estacionalidad_read_all" ON erp_estacionalidad;
CREATE POLICY "estacionalidad_read_all" ON erp_estacionalidad FOR SELECT TO authenticated USING (activo = true);

DROP POLICY IF EXISTS "estacionalidad_insert_all" ON erp_estacionalidad;
CREATE POLICY "estacionalidad_insert_all" ON erp_estacionalidad FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "estacionalidad_update_all" ON erp_estacionalidad;
CREATE POLICY "estacionalidad_update_all" ON erp_estacionalidad FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 3. INSERTAR FACTORES ESTACIONALES REPRESENTATIVOS
-- Guatemala tiene patrón climático estacional: Seca (Nov-Abr) vs Lluviosa (May-Oct)
-- ============================================================

-- Patrón para Guatemala Capital (GT-01) - Zona Central
INSERT INTO erp_estacionalidad (departamento_codigo, mes, factor_disponibilidad, factor_costo, factor_productividad, condiciones_especiales, activo) VALUES
('GT-01', 1, 1.10, 0.95, 1.15, 'Temporada seca - alta productividad', true),
('GT-01', 2, 1.10, 0.95, 1.15, 'Temporada seca - alta productividad', true),
('GT-01', 3, 1.10, 0.95, 1.15, 'Temporada seca - alta productividad', true),
('GT-01', 4, 1.08, 0.98, 1.12, 'Transición a lluvias', true),
('GT-01', 5, 0.95, 1.05, 0.92, 'Inicio lluvias - reducción disponibilidad', true),
('GT-01', 6, 0.90, 1.10, 0.85, 'Temporada lluviosa - baja productividad', true),
('GT-01', 7, 0.85, 1.15, 0.80, 'Temporada lluviosa - muy baja productividad', true),
('GT-01', 8, 0.85, 1.15, 0.80, 'Temporada lluviosa - muy baja productividad', true),
('GT-01', 9, 0.90, 1.10, 0.85, 'Temporada lluviosa - baja productividad', true),
('GT-01', 10, 0.95, 1.05, 0.92, 'Fin lluvias - recuperación gradual', true),
('GT-01', 11, 1.08, 0.98, 1.12, 'Transición a seco - mejor disponibilidad', true),
('GT-01', 12, 1.10, 0.95, 1.15, 'Temporada seca - alta productividad', true);

-- Alta Verapaz (GT-06) - Zona tropical húmeda
INSERT INTO erp_estacionalidad (departamento_codigo, mes, factor_disponibilidad, factor_costo, factor_productividad, condiciones_especiales, activo) VALUES
('GT-06', 1, 1.05, 0.98, 1.08, 'Temporada seca moderada', true),
('GT-06', 2, 1.05, 0.98, 1.08, 'Temporada seca moderada', true),
('GT-06', 3, 1.05, 0.98, 1.08, 'Temporada seca moderada', true),
('GT-06', 4, 1.00, 1.00, 1.00, 'Transición - condiciones neutras', true),
('GT-06', 5, 0.92, 1.08, 0.88, 'Inicio lluvias intensas', true),
('GT-06', 6, 0.88, 1.15, 0.82, 'Temporada muy lluviosa', true),
('GT-06', 7, 0.85, 1.20, 0.78, 'Pico de lluvias - mínima productividad', true),
('GT-06', 8, 0.85, 1.20, 0.78, 'Pico de lluvias - mínima productividad', true),
('GT-06', 9, 0.88, 1.15, 0.82, 'Temporada muy lluviosa', true),
('GT-06', 10, 0.92, 1.08, 0.88, 'Lluvias moderadas', true),
('GT-06', 11, 1.00, 1.00, 1.00, 'Transición - condiciones neutras', true),
('GT-06', 12, 1.05, 0.98, 1.08, 'Temporada seca moderada', true);

-- Escuintla (GT-07) - Zona costera calurosa
INSERT INTO erp_estacionalidad (departamento_codigo, mes, factor_disponibilidad, factor_costo, factor_productividad, condiciones_especiales, activo) VALUES
('GT-07', 1, 1.05, 1.02, 1.05, 'Seca pero muy caluroso - trabajo limitado a horarios tempranos', true),
('GT-07', 2, 1.05, 1.02, 1.05, 'Seca pero muy caluroso - trabajo limitado a horarios tempranos', true),
('GT-07', 3, 1.05, 1.02, 1.05, 'Seca pero muy caluroso - trabajo limitado a horarios tempranos', true),
('GT-07', 4, 1.05, 1.05, 1.02, 'Inicio calor intenso', true),
('GT-07', 5, 0.95, 1.12, 0.88, 'Calor extremo + lluvias', true),
('GT-07', 6, 0.90, 1.18, 0.82, 'Calor extremo + lluvias intensas', true),
('GT-07', 7, 0.88, 1.22, 0.78, 'Pico calor + lluvias - mínima productividad', true),
('GT-07', 8, 0.88, 1.22, 0.78, 'Pico calor + lluvias - mínima productividad', true),
('GT-07', 9, 0.90, 1.18, 0.82, 'Calor extremo + lluvias intensas', true),
('GT-07', 10, 0.95, 1.12, 0.88, 'Calor moderando + lluvias', true),
('GT-07', 11, 1.05, 1.02, 1.05, 'Mejorando condiciones climáticas', true),
('GT-07', 12, 1.05, 1.02, 1.05, 'Seca pero caluroso', true);

-- Quetzaltenango (GT-11) - Zona montañosa templada
INSERT INTO erp_estacionalidad (departamento_codigo, mes, factor_disponibilidad, factor_costo, factor_productividad, condiciones_especiales, activo) VALUES
('GT-11', 1, 1.12, 0.92, 1.18, 'Seca fría - excelente para trabajos estructurales', true),
('GT-11', 2, 1.12, 0.92, 1.18, 'Seca fría - excelente para trabajos estructurales', true),
('GT-11', 3, 1.12, 0.92, 1.18, 'Seca fría - excelente para trabajos estructurales', true),
('GT-11', 4, 1.10, 0.95, 1.15, 'Clima favorable', true),
('GT-11', 5, 0.98, 1.05, 0.95, 'Inicio lluvias pero clima templado', true),
('GT-11', 6, 0.92, 1.10, 0.88, 'Lluvias moderadas', true),
('GT-11', 7, 0.88, 1.15, 0.82, 'Lluvias intensas pero templadas', true),
('GT-11', 8, 0.88, 1.15, 0.82, 'Lluvias intensas pero templadas', true),
('GT-11', 9, 0.92, 1.10, 0.88, 'Lluvias moderadas', true),
('GT-11', 10, 0.98, 1.05, 0.95, 'Mejorando condiciones', true),
('GT-11', 11, 1.10, 0.95, 1.15, 'Clima favorable', true),
('GT-11', 12, 1.12, 0.92, 1.18, 'Seca fría - excelente para trabajos', true);

-- Petén (GT-05) - Zona tropical norte
INSERT INTO erp_estacionalidad (departamento_codigo, mes, factor_disponibilidad, factor_costo, factor_productividad, condiciones_especiales, activo) VALUES
('GT-05', 1, 1.08, 0.98, 1.12, 'Seca tropical - muy favorable', true),
('GT-05', 2, 1.08, 0.98, 1.12, 'Seca tropical - muy favorable', true),
('GT-05', 3, 1.08, 0.98, 1.12, 'Seca tropical - muy favorable', true),
('GT-05', 4, 1.05, 1.02, 1.05, 'Transición - condiciones neutras', true),
('GT-05', 5, 0.95, 1.10, 0.90, 'Inicio lluvias intensas', true),
('GT-05', 6, 0.88, 1.18, 0.82, 'Temporada muy lluviosa', true),
('GT-05', 7, 0.85, 1.25, 0.75, 'Pico de lluvias - mínima productividad', true),
('GT-05', 8, 0.85, 1.25, 0.75, 'Pico de lluvias - mínima productividad', true),
('GT-05', 9, 0.88, 1.18, 0.82, 'Temporada muy lluviosa', true),
('GT-05', 10, 0.95, 1.10, 0.90, 'Lluvias moderadas', true),
('GT-05', 11, 1.05, 1.02, 1.05, 'Transición - condiciones neutras', true),
('GT-05', 12, 1.08, 0.98, 1.12, 'Seca tropical - muy favorable', true);

-- Zacapa (GT-19) - Zona extremadamente seca y calurosa
INSERT INTO erp_estacionalidad (departamento_codigo, mes, factor_disponibilidad, factor_costo, factor_productividad, condiciones_especiales, activo) VALUES
('GT-19', 1, 1.00, 1.10, 0.90, 'Extremadamente seco y caluroso - limitaciones de horario', true),
('GT-19', 2, 1.00, 1.15, 0.88, 'Extremadamente seco y caluroso - limitaciones de horario', true),
('GT-19', 3, 1.00, 1.18, 0.85, 'Pico de calor extremo', true),
('GT-19', 4, 1.00, 1.15, 0.88, 'Calor extremo pero estable', true),
('GT-19', 5, 0.95, 1.08, 0.92, 'Ligeras lluvias - mejora clima', true),
('GT-19', 6, 0.92, 1.02, 0.95, 'Lluvias moderadas - mejor clima', true),
('GT-19', 7, 0.90, 0.98, 1.00, 'Temporada más favorable del año', true),
('GT-19', 8, 0.90, 0.98, 1.00, 'Temporada más favorable del año', true),
('GT-19', 9, 0.92, 1.02, 0.95, 'Lluvias moderadas', true),
('GT-19', 10, 0.95, 1.08, 0.92, 'Aumentando calor', true),
('GT-19', 11, 1.00, 1.15, 0.88, 'Calor extremo retornado', true),
('GT-19', 12, 1.00, 1.18, 0.85, 'Calor extremo estable', true);

-- ============================================================
-- 4. FUNCIÓN PARA OBTENER FACTOR ESTACIONAL
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_factor_estacional(
  p_departamento_codigo text,
  p_mes integer
)
RETURNS TABLE(
  factor_disponibilidad numeric,
  factor_costo numeric,
  factor_productividad numeric,
  condiciones_especiales text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    factor_disponibilidad,
    factor_costo,
    factor_productividad,
    condiciones_especiales
  FROM erp_estacionalidad
  WHERE departamento_codigo = p_departamento_codigo
    AND mes = p_mes
    AND activo = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FUNCIÓN PARA APLICAR AJUSTES ESTACIONALES A PRESUPUESTO
-- ============================================================

CREATE OR REPLACE FUNCTION aplicar_ajuste_estacional(
  p_departamento_codigo text,
  p_fecha_inicio date,
  p_dias_duracion integer,
  p_costo_base numeric
)
RETURNS TABLE(
  costo_base numeric,
  factor_estacional_promedio numeric,
  costo_ajustado numeric,
  diferencia_costo numeric,
  porcentaje_ajuste numeric,
  condiciones_especiales text[]
) AS $$
DECLARE
  v_fecha_actual date := p_fecha_inicio;
  v_fecha_fin date := p_fecha_inicio + (p_dias_duracion || ' days')::interval;
  v_factor_total numeric := 0;
  v_factor_count integer := 0;
  v_factor_estacional numeric;
  v_factor_promedio numeric;
  v_costo_ajustado numeric;
  v_condiciones text[] := '{}';
  v_registro RECORD;
BEGIN
  -- Calcular promedio de factores estacionales durante el período
  WHILE v_fecha_actual <= v_fecha_fin LOOP
    SELECT * INTO v_registro FROM obtener_factor_estacional(p_departamento_codigo, EXTRACT(MONTH FROM v_fecha_actual)::integer);
    
    IF FOUND THEN
      v_factor_total := v_factor_total + (v_registro.factor_costo * v_registro.factor_productividad);
      v_factor_count := v_factor_count + 1;
      
      IF v_registro.condiciones_especiales IS NOT NULL THEN
        v_condiciones := array_append(v_condiciones, v_registro.condiciones_especiales);
      END IF;
    END IF;
    
    v_fecha_actual := v_fecha_actual + INTERVAL '1 day';
  END LOOP;
  
  -- Calcular factor promedio
  IF v_factor_count > 0 THEN
    v_factor_promedio := v_factor_total / v_factor_count;
  ELSE
    v_factor_promedio := 1.0; -- Sin datos, usar factor neutro
  END IF;
  
  -- Aplicar factor al costo base
  v_costo_ajustado := p_costo_base * v_factor_promedio;
  
  RETURN QUERY
  SELECT
    p_costo_base as costo_base,
    v_factor_promedio as factor_estacional_promedio,
    v_costo_ajustado as costo_ajustado,
    (v_costo_ajustado - p_costo_base) as diferencia_costo,
    ((v_costo_ajustado - p_costo_base) / p_costo_base * 100) as porcentaje_ajuste,
    v_condiciones as condiciones_especiales;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. TRIGGER DE ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_estacionalidad()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_estacionalidad ON erp_estacionalidad;
CREATE TRIGGER trigger_actualizar_estacionalidad
BEFORE UPDATE ON erp_estacionalidad
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_estacionalidad();

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT 'Tabla estacionalidad' as componente, COUNT(*) as total FROM erp_estacionalidad
UNION ALL
SELECT 'Función obtener_factor_estacional', 1 FROM pg_proc WHERE proname = 'obtener_factor_estacional'
UNION ALL
SELECT 'Función aplicar_ajuste_estacional', 1 FROM pg_proc WHERE proname = 'aplicar_ajuste_estacional';