-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 3: MUROS DE CONTENCIÓN
-- 25 combinaciones representativas (5 alturas × 5 tipos)
-- Versión: 2026-06-20
-- ============================================================

-- ============================================================
-- 1. TABLA DE PARÁMETROS DE MUROS DE CONTENCIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_parametros_muros_contencion (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  altura_m numeric(4,2) NOT NULL CHECK (altura_m BETWEEN 1.0 AND 10.0),
  tipo text NOT NULL CHECK (tipo IN ('gravedad','cantiliver','atirantado','tipo celular','pantalla')),
  tipo_cimentacion text NOT NULL CHECK (tipo_cimentacion IN ('zapata_corrida','pilotes','losa')),
  tipo_suelo text NOT NULL CHECK (tipo_suelo IN ('arcilla','arena','roca','relleno_compactado','granular')),
  tipo_drenaje text NOT NULL CHECK (tipo_drenaje IN ('sin_drenaje','drenaje_superficial','drenaje_interno','drenaje_completo')),
  costo_base_m2 numeric(8,2) NOT NULL,
  factor_profundidad numeric(4,2) NOT NULL,
  factor_suelo numeric(4,2) NOT NULL,
  factor_drenaje numeric(4,2) NOT NULL,
  referencia_norma text,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parametros_muros_combo ON erp_parametros_muros_contencion(altura_m, tipo, tipo_cimentacion, tipo_suelo, tipo_drenaje);
CREATE INDEX IF NOT EXISTS idx_parametros_muros_activas ON erp_parametros_muros_contencion(activo);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_parametros_muros_contencion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parametros_muros_contencion_read_all" ON erp_parametros_muros_contencion FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "parametros_muros_contencion_insert_all" ON erp_parametros_muros_contencion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "parametros_muros_contencion_update_all" ON erp_parametros_muros_contencion FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 3. INSERTAR 25 COMBINACIONES DE PARÁMETROS
-- Basadas en costos de construcción Guatemala 2026
-- ============================================================

-- MUROS DE GRAVEDAD - ALTURAS 1-2M
INSERT INTO erp_parametros_muros_contencion (altura_m, tipo, tipo_cimentacion, tipo_suelo, tipo_drenaje, costo_base_m2, factor_profundidad, factor_suelo, factor_drenaje, referencia_norma, observaciones) VALUES
(1.0, 'gravedad', 'zapata_corrida', 'arcilla', 'sin_drenaje', 280.00, 1.0, 1.3, 1.0, 'AGIES 62.01', 'Muro gravedad 1m arcilla'),
(1.5, 'gravedad', 'zapata_corrida', 'arena', 'drenaje_superficial', 320.00, 1.15, 1.1, 1.2, 'AGIES 62.01', 'Muro gravedad 1.5m arena'),
(2.0, 'gravedad', 'zapata_corrida', 'granular', 'drenaje_interno', 380.00, 1.3, 1.0, 1.1, 'AGIES 62.01', 'Muro gravedad 2m granular'),

(3.0, 'gravedad', 'pilotes', 'roca', 'sin_drenaje', 450.00, 1.6, 0.9, 1.0, 'AGIES 62.01', 'Muro gravedad 3m roca'),
(4.0, 'gravedad', 'pilotes', 'relleno_compactado', 'drenaje_completo', 520.00, 1.9, 1.2, 1.3, 'AGIES 62.01', 'Muro gravedad 4m relleno compactado');

-- MUROS CANTILIVER
INSERT INTO erp_parametros_muros_contencion (altura_m, tipo, tipo_cimentacion, tipo_suelo, tipo_drenaje, costo_base_m2, factor_profundidad, factor_suelo, factor_drenaje, referencia_norma, observaciones) VALUES
(1.5, 'cantiliver', 'zapata_corrida', 'arcilla', 'drenaje_interno', 380.00, 1.15, 1.3, 1.2, 'AGIES 62.02', 'Muro cantiliver 1.5m'),
(2.0, 'cantiliver', 'zapata_corrida', 'arena', 'drenaje_completo', 450.00, 1.3, 1.1, 1.3, 'AGIES 62.02', 'Muro cantiliver 2m'),
(3.0, 'cantiliver', 'pilotes', 'granular', 'drenaje_interno', 550.00, 1.6, 1.0, 1.1, 'AGIES 62.02', 'Muro cantiliver 3m'),
(4.0, 'cantiliver', 'pilotes', 'roca', 'sin_drenaje', 680.00, 1.9, 0.9, 1.0, 'AGIES 62.02', 'Muro cantiliver 4m'),
(5.0, 'cantiliver', 'pilotes', 'arcilla', 'drenaje_completo', 850.00, 2.3, 1.3, 1.3, 'AGIES 62.02', 'Muro cantiliver 5m');

-- MUROS ATIRANTADOS
INSERT INTO erp_parametros_muros_contencion (altura_m, tipo, tipo_cimentacion, tipo_suelo, tipo_drenaje, costo_base_m2, factor_profundidad, factor_suelo, factor_drenaje, referencia_norma, observaciones) VALUES
(2.0, 'atirantado', 'zapata_corrida', 'arena', 'drenaje_interno', 420.00, 1.3, 1.1, 1.1, 'AGIES 62.03', 'Muro atirantado 2m'),
(3.0, 'atirantado', 'pilotes', 'granular', 'drenaje_completo', 500.00, 1.6, 1.0, 1.3, 'AGIES 62.03', 'Muro atirantado 3m'),
(4.0, 'atirantado', 'pilotes', 'arcilla', 'drenaje_interno', 620.00, 1.9, 1.3, 1.2, 'AGIES 62.03', 'Muro atirantado 4m'),
(5.0, 'atirantado', 'pilotes', 'roca', 'sin_drenaje', 780.00, 2.3, 0.9, 1.0, 'AGIES 62.03', 'Muro atirantado 5m'),
(6.0, 'atirantado', 'losa', 'granular', 'drenaje_completo', 950.00, 2.7, 1.0, 1.3, 'AGIES 62.03', 'Muro atirantado 6m');

-- MUROS TIPO CELULAR
INSERT INTO erp_parametros_muros_contencion (altura_m, tipo, tipo_cimentacion, tipo_suelo, tipo_drenaje, costo_base_m2, factor_profundidad, factor_suelo, factor_drenaje, referencia_norma, observaciones) VALUES
(3.0, 'tipo celular', 'losa', 'arena', 'sin_drenaje', 480.00, 1.6, 1.1, 1.0, 'AGIES 62.04', 'Muro celular 3m'),
(4.0, 'tipo celular', 'losa', 'arcilla', 'drenaje_superficial', 580.00, 1.9, 1.3, 1.1, 'AGIES 62.04', 'Muro celular 4m'),
(5.0, 'tipo celular', 'pilotes', 'granular', 'drenaje_interno', 720.00, 2.3, 1.0, 1.2, 'AGIES 62.04', 'Muro celular 5m'),
(6.0, 'tipo celular', 'pilotes', 'arena', 'drenaje_completo', 880.00, 2.7, 1.1, 1.3, 'AGIES 62.04', 'Muro celular 6m'),
(8.0, 'tipo celular', 'pilotes', 'roca', 'sin_drenaje', 1200.00, 3.5, 0.9, 1.0, 'AGIES 62.04', 'Muro celular 8m');

-- MUROS PANTALLA
INSERT INTO erp_parametros_muros_contencion (altura_m, tipo, tipo_cimentacion, tipo_suelo, tipo_drenaje, costo_base_m2, factor_profundidad, factor_suelo, factor_drenaje, referencia_norma, observaciones) VALUES
(2.0, 'pantalla', 'zapata_corrida', 'arcilla', 'drenaje_interno', 400.00, 1.3, 1.3, 1.2, 'AGIES 62.05', 'Muro pantalla 2m'),
(3.0, 'pantalla', 'pilotes', 'arena', 'drenaje_completo', 520.00, 1.6, 1.1, 1.3, 'AGIES 62.05', 'Muro pantalla 3m'),
(4.0, 'pantalla', 'pilotes', 'granular', 'drenaje_interno', 650.00, 1.9, 1.0, 1.1, 'AGIES 62.05', 'Muro pantalla 4m'),
(5.0, 'pantalla', 'pilotes', 'arcilla', 'sin_drenaje', 820.00, 2.3, 1.3, 1.0, 'AGIES 62.05', 'Muro pantalla 5m'),
(10.0, 'pantalla', 'pilotes', 'roca', 'drenaje_interno', 1500.00, 4.5, 0.9, 1.1, 'AGIES 62.05', 'Muro pantalla 10m');

-- ============================================================
-- 4. FUNCIÓN PARA CALCULAR MUROS DE CONTENCIÓN
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_muro_contencion(
  p_altura_m numeric,
  p_tipo text,
  p_tipo_cimentacion text,
  p_tipo_suelo text,
  p_tipo_drenaje text,
  p_longitud_m numeric
)
RETURNS TABLE(
  costo_unitario_m2 numeric,
  costo_total numeric,
  factor_ajuste_total numeric,
  volumen_concreto_m3 numeric,
  referencia_norma text
) AS $$
DECLARE
  v_parametros RECORD;
  v_factor_total numeric;
  v_costo_unitario numeric;
  v_costo_total numeric;
  v_volumen_concreto numeric;
BEGIN
  -- Obtener parámetros base
  SELECT * INTO v_parametros
  FROM erp_parametros_muros_contencion
  WHERE altura_m = p_altura_m
    AND tipo = p_tipo
    AND tipo_cimentacion = p_tipo_cimentacion
    AND tipo_suelo = p_tipo_suelo
    AND tipo_drenaje = p_tipo_drenaje
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    -- Si no se encuentra combinación exacta, usar valores por defecto
    v_parametros.costo_base_m2 := 500;
    v_parametros.factor_profundidad := 1.5;
    v_parametros.factor_suelo := 1.1;
    v_parametros.factor_drenaje := 1.0;
    v_parametros.referencia_norma := 'AGIES 62.01 (default)';
  END IF;

  -- Calcular factor total de ajuste
  v_factor_total := v_parametros.factor_profundidad * v_parametros.factor_suelo * v_parametros.factor_drenaje;
  
  -- Calcular costo unitario ajustado
  v_costo_unitario := v_parametros.costo_base_m2 * v_factor_total;
  
  -- Calcular costo total para la longitud
  v_costo_total := v_costo_unitario * (p_altura_m * p_longitud_m);
  
  -- Calcular volumen de concreto aproximado (0.3m³ por m² de muro)
  v_volumen_concreto := (p_altura_m * p_longitud_m) * 0.3;
  
  -- Retornar resultados
  RETURN QUERY
  SELECT
    v_costo_unitario as costo_unitario_m2,
    v_costo_total as costo_total,
    v_factor_total as factor_ajuste_total,
    v_volumen_concreto as volumen_concreto_m3,
    v_parametros.referencia_norma as referencia_norma;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_parametros_muros()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_parametros_muros
BEFORE UPDATE ON erp_parametros_muros_contencion
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_parametros_muros();