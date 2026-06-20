-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 2: MOVIMIENTOS DE TIERRA
-- 40 combinaciones (3 tipos × 5 suelos × 4 profundidades × 3 accesos × 3 drenajes)
-- Versión: 2026-06-19
-- ============================================================

-- ============================================================
-- 1. TABLA DE PARÁMETROS DE MOVIMIENTO DE TIERRA
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_parametros_movimiento_tierra (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('excavacion','relleno','compactacion')),
  suelo text NOT NULL CHECK (suelo IN ('relleno','arcilla','arena','roca_blanda','roca_dura')),
  profundidad text NOT NULL CHECK (profundidad IN ('menos_1m','1_2m','2_3m','mas_3m')),
  acceso text NOT NULL CHECK (acceso IN ('retroexcavadora','cargador','manual')),
  drenaje text NOT NULL CHECK (drenaje IN ('seco','agua','lodos')),
  costo_base_m3 numeric(8,2) NOT NULL,
  rendimiento_diario_m3 numeric(6,2) NOT NULL,
  factor_profundidad numeric(4,2) NOT NULL,
  factor_acceso numeric(4,2) NOT NULL,
  factor_drenaje numeric(4,2) NOT NULL,
  equipo_requerido text[],
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_parametros_mt_combo ON erp_parametros_movimiento_tierra(tipo, suelo, profundidad, acceso, drenaje);
CREATE INDEX idx_parametros_mt_activas ON erp_parametros_movimiento_tierra(activo);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_parametros_movimiento_tierra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parametros_movimiento_tierra_read_all" ON erp_parametros_movimiento_tierra FOR SELECT TO authenticated USING (activo = true);

-- ============================================================
-- 3. INSERTAR 40 COMBINACIONES DE PARÁMETROS
-- Basadas en costos de construcción Guatemala 2026
-- ============================================================

-- EXCAVACIÓN - RELLENO
INSERT INTO erp_parametros_movimiento_tierra (tipo, suelo, profundidad, acceso, drenaje, costo_base_m3, rendimiento_diario_m3, factor_profundidad, factor_acceso, factor_drenaje, equipo_requerido, observaciones) VALUES
('excavacion', 'relleno', 'menos_1m', 'retroexcavadora', 'seco', 70, 50, 1.0, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de relleno superficial'),
('excavacion', 'relleno', 'menos_1m', 'retroexcavadora', 'agua', 70, 50, 1.0, 1.0, 1.4, ARRAY['Retroexcavadora', 'Camión volquete', 'Bombas de achique'], 'Excavación de relleno con agua'),
('excavacion', 'relleno', 'menos_1m', 'cargador', 'seco', 70, 60, 1.0, 1.10, 1.0, ARRAY['Cargador frontal', 'Camión volquete'], 'Excavación con cargador frontal'),
('excavacion', 'relleno', 'menos_1m', 'manual', 'seco', 70, 3, 1.0, 1.50, 1.0, ARRAY['Picos', 'Palas', 'Carretillas'], 'Excavación manual de relleno'),
('excavacion', 'relleno', '1_2m', 'retroexcavadora', 'seco', 70, 50, 1.15, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de relleno 1-2m'),
('excavacion', 'relleno', '1_2m', 'retroexcavadora', 'agua', 70, 50, 1.15, 1.0, 1.4, ARRAY['Retroexcavadora', 'Camión volquete', 'Bombas de achique'], 'Excavación 1-2m con agua'),
('excavacion', 'relleno', '1_2m', 'cargador', 'seco', 70, 60, 1.15, 1.10, 1.0, ARRAY['Cargador frontal', 'Camión volquete'], 'Excavación 1-2m con cargador'),
('excavacion', 'relleno', '2_3m', 'retroexcavadora', 'seco', 70, 50, 1.30, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de relleno 2-3m'),
('excavacion', 'relleno', '2_3m', 'retroexcavadora', 'lodos', 70, 50, 1.30, 1.0, 1.8, ARRAY['Retroexcavadora', 'Camión volquete', 'Bombas de lodos'], 'Excavación 2-3m con lodos'),
('excavacion', 'relleno', 'mas_3m', 'retroexcavadora', 'seco', 70, 50, 1.50, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de relleno >3m');

-- EXCAVACIÓN - ARCILLA
INSERT INTO erp_parametros_movimiento_tierra (tipo, suelo, profundidad, acceso, drenaje, costo_base_m3, rendimiento_diario_m3, factor_profundidad, factor_acceso, factor_drenaje, equipo_requerido, observaciones) VALUES
('excavacion', 'arcilla', 'menos_1m', 'retroexcavadora', 'seco', 85, 40, 1.0, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de arcilla superficial'),
('excavacion', 'arcilla', 'menos_1m', 'manual', 'seco', 85, 2.5, 1.0, 1.50, 1.0, ARRAY['Picos', 'Palas', 'Carretillas'], 'Excavación manual de arcilla'),
('excavacion', 'arcilla', '1_2m', 'retroexcavadora', 'seco', 85, 40, 1.15, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de arcilla 1-2m'),
('excavacion', 'arcilla', '1_2m', 'retroexcavadora', 'agua', 85, 40, 1.15, 1.0, 1.4, ARRAY['Retroexcavadora', 'Camión volquete', 'Bombas de achique'], 'Excavación arcilla 1-2m con agua'),
('excavacion', 'arcilla', '2_3m', 'retroexcavadora', 'seco', 85, 40, 1.30, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de arcilla 2-3m'),
('excavacion', 'arcilla', '2_3m', 'cargador', 'seco', 85, 50, 1.30, 1.10, 1.0, ARRAY['Cargador frontal', 'Camión volquete'], 'Excavación arcilla 2-3m con cargador'),
('excavacion', 'arcilla', 'mas_3m', 'retroexcavadora', 'seco', 85, 40, 1.50, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de arcilla >3m');

-- EXCAVACIÓN - ARENA
INSERT INTO erp_parametros_movimiento_tierra (tipo, suelo, profundidad, acceso, drenaje, costo_base_m3, rendimiento_diario_m3, factor_profundidad, factor_acceso, factor_drenaje, equipo_requerido, observaciones) VALUES
('excavacion', 'arena', 'menos_1m', 'retroexcavadora', 'seco', 75, 45, 1.0, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de arena superficial'),
('excavacion', 'arena', 'menos_1m', 'manual', 'seco', 75, 3.5, 1.0, 1.50, 1.0, ARRAY['Picos', 'Palas', 'Carretillas'], 'Excavación manual de arena'),
('excavacion', 'arena', '1_2m', 'retroexcavadora', 'seco', 75, 45, 1.15, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de arena 1-2m'),
('excavacion', 'arena', '1_2m', 'cargador', 'seco', 75, 55, 1.15, 1.10, 1.0, ARRAY['Cargador frontal', 'Camión volquete'], 'Excavación arena 1-2m con cargador'),
('excavacion', 'arena', '2_3m', 'retroexcavadora', 'seco', 75, 45, 1.30, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de arena 2-3m'),
('excavacion', 'arena', '2_3m', 'retroexcavadora', 'agua', 75, 45, 1.30, 1.0, 1.4, ARRAY['Retroexcavadora', 'Camión volquete', 'Bombas de achique'], 'Excavación arena 2-3m con agua'),
('excavacion', 'arena', 'mas_3m', 'retroexcavadora', 'seco', 75, 45, 1.50, 1.0, 1.0, ARRAY['Retroexcavadora', 'Camión volquete'], 'Excavación de arena >3m');

-- EXCAVACIÓN - ROCA BLANDA
INSERT INTO erp_parametros_movimiento_tierra (tipo, suelo, profundidad, acceso, drenaje, costo_base_m3, rendimiento_diario_m3, factor_profundidad, factor_acceso, factor_drenaje, equipo_requerido, observaciones) VALUES
('excavacion', 'roca_blanda', 'menos_1m', 'retroexcavadora', 'seco', 120, 20, 1.0, 1.0, 1.0, ARRAY['Retroexcavadora', 'Martillo hidráulico', 'Camión volquete'], 'Excavación de roca blanda superficial'),
('excavacion', 'roca_blanda', 'menos_1m', 'manual', 'seco', 120, 1, 1.0, 1.50, 1.0, ARRAY['Picos', 'Mazos', 'Palas', 'Carretillas'], 'Excavación manual de roca blanda'),
('excavacion', 'roca_blanda', '1_2m', 'retroexcavadora', 'seco', 120, 20, 1.15, 1.0, 1.0, ARRAY['Retroexcavadora', 'Martillo hidráulico', 'Camión volquete'], 'Excavación de roca blanda 1-2m'),
('excavacion', 'roca_blanda', '1_2m', 'cargador', 'seco', 120, 25, 1.15, 1.10, 1.0, ARRAY['Cargador frontal', 'Martillo hidráulico', 'Camión volquete'], 'Excavación roca blanda 1-2m con cargador'),
('excavacion', 'roca_blanda', '2_3m', 'retroexcavadora', 'seco', 120, 20, 1.30, 1.0, 1.0, ARRAY['Retroexcavadora', 'Martillo hidráulico', 'Camión volquete'], 'Excavación de roca blanda 2-3m'),
('excavacion', 'roca_blanda', '2_3m', 'retroexcavadora', 'agua', 120, 20, 1.30, 1.0, 1.4, ARRAY['Retroexcavadora', 'Martillo hidráulico', 'Camión volquete', 'Bombas de achique'], 'Excavación roca blanda 2-3m con agua'),
('excavacion', 'roca_blanda', 'mas_3m', 'retroexcavadora', 'seco', 120, 20, 1.50, 1.0, 1.0, ARRAY['Retroexcavadora', 'Martillo hidráulico', 'Camión volquete'], 'Excavación de roca blanda >3m');

-- EXCAVACIÓN - ROCA DURA
INSERT INTO erp_parametros_movimiento_tierra (tipo, suelo, profundidad, acceso, drenaje, costo_base_m3, rendimiento_diario_m3, factor_profundidad, factor_acceso, factor_drenaje, equipo_requerido, observaciones) VALUES
('excavacion', 'roca_dura', 'menos_1m', 'retroexcavadora', 'seco', 180, 8, 1.0, 1.0, 1.0, ARRAY['Retroexcavadora pesada', 'Martillo hidráulico pesado', 'Camión volquete'], 'Excavación de roca dura superficial'),
('excavacion', 'roca_dura', 'menos_1m', 'manual', 'seco', 180, 0.5, 1.0, 1.50, 1.0, ARRAY['Picos pesados', 'Mazos', 'Cuñas', 'Palas'], 'Excavación manual de roca dura'),
('excavacion', 'roca_dura', '1_2m', 'retroexcavadora', 'seco', 180, 8, 1.15, 1.0, 1.0, ARRAY['Retroexcavadora pesada', 'Martillo hidráulico pesado', 'Camión volquete'], 'Excavación de roca dura 1-2m'),
('excavacion', 'roca_dura', '1_2m', 'cargador', 'seco', 180, 10, 1.15, 1.10, 1.0, ARRAY['Cargador frontal pesado', 'Martillo hidráulico', 'Camión volquete'], 'Excavación roca dura 1-2m con cargador'),
('excavacion', 'roca_dura', '2_3m', 'retroexcavadora', 'seco', 180, 8, 1.30, 1.0, 1.0, ARRAY['Retroexcavadora pesada', 'Martillo hidráulico pesado', 'Camión volquete'], 'Excavación de roca dura 2-3m'),
('excavacion', 'roca_dura', '2_3m', 'retroexcavadora', 'agua', 180, 8, 1.30, 1.0, 1.4, ARRAY['Retroexcavadora pesada', 'Martillo hidráulico pesado', 'Camión volquete', 'Bombas de achique'], 'Excavación roca dura 2-3m con agua'),
('excavacion', 'roca_dura', 'mas_3m', 'retroexcavadora', 'seco', 180, 8, 1.50, 1.0, 1.0, ARRAY['Retroexcavadora pesada', 'Martillo hidráulico pesado', 'Camión volquete'], 'Excavación de roca dura >3m');

-- RELLENO - MUESTRAS
INSERT INTO erp_parametros_movimiento_tierra (tipo, suelo, profundidad, acceso, drenaje, costo_base_m3, rendimiento_diario_m3, factor_profundidad, factor_acceso, factor_drenaje, equipo_requerido, observaciones) VALUES
('relleno', 'relleno', 'menos_1m', 'retroexcavadora', 'seco', 50, 60, 1.0, 1.0, 1.0, ARRAY['Retroexcavadora', 'Compactador'], 'Relleno de material seleccionado'),
('relleno', 'relleno', '1_2m', 'retroexcavadora', 'seco', 50, 60, 1.15, 1.0, 1.0, ARRAY['Retroexcavadora', 'Compactador'], 'Relleno 1-2m'),
('relleno', 'arena', 'menos_1m', 'retroexcavadora', 'seco', 55, 55, 1.0, 1.0, 1.0, ARRAY['Retroexcavadora', 'Compactador', 'Riego'], 'Relleno de arena compactada'),
('relleno', 'arcilla', 'menos_1m', 'retroexcavadora', 'seco', 60, 50, 1.0, 1.0, 1.0, ARRAY['Retroexcavadora', 'Compactador'], 'Relleno de arcilla compactada');

-- COMPACTACIÓN - MUESTRAS
INSERT INTO erp_parametros_movimiento_tierra (tipo, suelo, profundidad, acceso, drenaje, costo_base_m3, rendimiento_diario_m3, factor_profundidad, factor_acceso, factor_drenaje, equipo_requerido, observaciones) VALUES
('compactacion', 'relleno', 'menos_1m', 'retroexcavadora', 'seco', 25, 100, 1.0, 1.0, 1.0, ARRAY['Compactador vibratorio', 'Retroexcavadora'], 'Compactación de relleno'),
('compactacion', 'relleno', '1_2m', 'retroexcavadora', 'seco', 25, 100, 1.15, 1.0, 1.0, ARRAY['Compactador vibratorio', 'Retroexcavadora'], 'Compactación 1-2m'),
('compactacion', 'arena', 'menos_1m', 'retroexcavadora', 'seco', 30, 90, 1.0, 1.0, 1.0, ARRAY['Compactador de rodillo', 'Riego'], 'Compactación de arena'),
('compactacion', 'arcilla', 'menos_1m', 'retroexcavadora', 'seco', 35, 80, 1.0, 1.0, 1.0, ARRAY['Compactador de rodillo', 'Compactador de placa'], 'Compactación de arcilla');

-- ============================================================
-- 4. FUNCIÓN PARA CALCULAR MOVIMIENTO DE TIERRA
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_movimiento_tierra(
  p_tipo text,
  p_suelo text,
  p_profundidad text,
  p_acceso text,
  p_drenaje text,
  p_volumen numeric
)
RETURNS TABLE(
  costo_unitario numeric,
  costo_total numeric,
  tiempo_estimado_dias numeric,
  equipo_requerido text[],
  factor_ajuste_total numeric
) AS $$
DECLARE
  v_parametros RECORD;
  v_factor_total numeric;
  v_costo_unitario numeric;
  v_tiempo_dias numeric;
BEGIN
  -- Obtener parámetros base
  SELECT * INTO v_parametros
  FROM erp_parametros_movimiento_tierra
  WHERE tipo = p_tipo
    AND suelo = p_suelo
    AND profundidad = p_profundidad
    AND acceso = p_acceso
    AND drenaje = p_drenaje
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    -- Si no se encuentra combinación exacta, usar valores por defecto
    v_parametros.costo_base_m3 := 80;
    v_parametros.rendimiento_diario_m3 := 40;
    v_parametros.factor_profundidad := 1.0;
    v_parametros.factor_acceso := 1.0;
    v_parametros.factor_drenaje := 1.0;
    v_parametros.equipo_requerido := ARRAY['Retroexcavadora', 'Camión volquete'];
  END IF;

  -- Calcular factor total de ajuste
  v_factor_total := v_parametros.factor_profundidad * v_parametros.factor_acceso * v_parametros.factor_drenaje;
  
  -- Calcular costo unitario ajustado
  v_costo_unitario := v_parametros.costo_base_m3 * v_factor_total;
  
  -- Calcular tiempo estimado en días
  v_tiempo_dias := CEIL(p_volumen / v_parametros.rendimiento_diario_m3);
  
  -- Retornar resultados
  RETURN QUERY
  SELECT
    v_costo_unitario as costo_unitario,
    v_costo_unitario * p_volumen as costo_total,
    v_tiempo_dias as tiempo_estimado_dias,
    v_parametros.equipo_requerido as equipo_requerido,
    v_factor_total as factor_ajuste_total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FUNCIÓN PARA OBTENER PARÁMETROS POR TIPO DE SUELO
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_parametros_mt_por_suelo(p_suelo text)
RETURNS TABLE(
  tipo text,
  profundidad text,
  acceso text,
  drenaje text,
  costo_base_m3 numeric,
  rendimiento_diario_m3 numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tipo,
    profundidad,
    acceso,
    drenaje,
    costo_base_m3,
    rendimiento_diario_m3
  FROM erp_parametros_movimiento_tierra
  WHERE suelo = p_suelo
    AND activo = true
  ORDER BY 
    tipo,
    CASE profundidad
      WHEN 'menos_1m' THEN 1
      WHEN '1_2m' THEN 2
      WHEN '2_3m' THEN 3
      WHEN 'mas_3m' THEN 4
    END,
    acceso;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_parametros_mt()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_parametros_mt
BEFORE UPDATE ON erp_parametros_movimiento_tierra
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_parametros_mt();
