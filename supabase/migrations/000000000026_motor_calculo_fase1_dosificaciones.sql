-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 1: DOSIFICACIONES DE CONCRETO
-- 35 combinaciones técnicas (resistencias × tipos × agregados × aditivos × curados)
-- Versión: 2026-06-13
-- ============================================================

-- ============================================================
-- 1. TABLA DE DOSIFICACIONES DE CONCRETO
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_dosificaciones_concreto (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  resistencia text NOT NULL CHECK (resistencia IN ('2000psi','2500psi','3000psi','3500psi','4000psi','4500psi','5000psi')),
  tipo text NOT NULL CHECK (tipo IN ('cimentacion','estructura','losa','pavimento','muro')),
  tamaño_agregado text NOT NULL CHECK (tamaño_agregado IN ('3/4"','1"','1.5"','2"')),
  aditivos text NOT NULL CHECK (aditivos IN ('ninguno','acelerador','retardador','plastificante','impermeabilizante')),
  curado text NOT NULL CHECK (curado IN ('normal','acelerado','prolongado')),
  cemento_sacos_m3 numeric(5,2) NOT NULL,
  arena_m3_m3 numeric(5,3) NOT NULL,
  piedra_m3_m3 numeric(5,3) NOT NULL,
  agua_lt_m3 numeric(6,1) NOT NULL,
  referencia_norma text, -- ASTM C-39, AGIES 42.01, COGUANOR NGO 41009
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_dosificaciones_concreto_combo ON erp_dosificaciones_concreto(resistencia, tipo, tamaño_agregado, aditivos, curado);
CREATE INDEX idx_dosificaciones_concreto_activas ON erp_dosificaciones_concreto(activo);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_dosificaciones_concreto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dosificaciones_concreto_read_all" ON erp_dosificaciones_concreto FOR SELECT TO authenticated USING (activo = true);

-- ============================================================
-- 3. INSERTAR 35 COMBINACIONES DE DOSIFICACIÓN
-- Basadas en normas ASTM C-39, AGIES 42.01, COGUANOR NGO 41009
-- ============================================================

-- RESISTENCIA 2000 PSI
INSERT INTO erp_dosificaciones_concreto (resistencia, tipo, tamaño_agregado, aditivos, curado, cemento_sacos_m3, arena_m3_m3, piedra_m3_m3, agua_lt_m3, referencia_norma, observaciones) VALUES
-- Cimentaciones
('2000psi', 'cimentacion', '3/4"', 'ninguno', 'normal', 5.5, 0.50, 0.95, 170, 'ASTM C-39, AGIES 42.01', 'Cimentación simple, agregado 3/4"'),
('2000psi', 'cimentacion', '3/4"', 'acelerador', 'normal', 5.5, 0.50, 0.95, 165, 'ASTM C-39, AGIES 42.01', 'Con acelerador para curado rápido'),
('2000psi', 'cimentacion', '3/4"', 'ninguno', 'acelerado', 5.5, 0.50, 0.95, 160, 'ASTM C-39, AGIES 42.01', 'Curado acelerado'),
-- Estructuras
('2000psi', 'estructura', '3/4"', 'ninguno', 'normal', 6.0, 0.48, 0.92, 175, 'ASTM C-39, AGIES 42.01', 'Estructura ligera, 2000psi'),
('2000psi', 'estructura', '1"', 'ninguno', 'normal', 6.0, 0.45, 0.90, 175, 'ASTM C-39, AGIES 42.01', 'Estructura ligera, agregado 1"'),
('2000psi', 'estructura', '3/4"', 'plastificante', 'normal', 5.8, 0.48, 0.92, 170, 'ASTM C-39, AGIES 42.01', 'Con plastificante para trabajabilidad'),
-- Losas
('2000psi', 'losa', '3/4"', 'ninguno', 'normal', 6.5, 0.45, 0.90, 180, 'ASTM C-39, AGIES 42.01', 'Losa ligera'),
('2000psi', 'losa', '3/4"', 'plastificante', 'normal', 6.3, 0.45, 0.90, 175, 'ASTM C-39, AGIES 42.01', 'Losa con plastificante'),
('2000psi', 'pavimento', '3/4"', 'ninguno', 'normal', 6.0, 0.48, 0.92, 175, 'ASTM C-39, AGIES 51.01', 'Pavimento ligero'),
ON CONFLICT DO NOTHING;

-- RESISTENCIA 2500 PSI
INSERT INTO erp_dosificaciones_concreto (resistencia, tipo, tamaño_agregado, aditivos, curado, cemento_sacos_m3, arena_m3_m3, piedra_m3_m3, agua_lt_m3, referencia_norma, observaciones) VALUES
('2500psi', 'cimentacion', '3/4"', 'ninguno', 'normal', 6.0, 0.48, 0.92, 175, 'ASTM C-39, AGIES 42.01', 'Cimentación media, 2500psi'),
('2500psi', 'cimentacion', '3/4"', 'ninguno', 'acelerado', 6.0, 0.48, 0.92, 170, 'ASTM C-39, AGIES 42.01', 'Curado acelerado'),
('2500psi', 'estructura', '3/4"', 'ninguno', 'normal', 6.5, 0.46, 0.90, 178, 'ASTM C-39, AGIES 42.01', 'Estructura media, 2500psi'),
('2500psi', 'estructura', '3/4"', 'plastificante', 'normal', 6.3, 0.46, 0.90, 175, 'ASTM C-39, AGIES 42.01', 'Con plastificante'),
('2500psi', 'estructura', '1"', 'ninguno', 'normal', 6.5, 0.43, 0.88, 178, 'ASTM C-39, AGIES 42.01', 'Estructura media, agregado 1"'),
('2500psi', 'losa', '3/4"', 'ninguno', 'normal', 7.0, 0.44, 0.88, 182, 'ASTM C-39, AGIES 42.01', 'Losa media'),
('2500psi', 'pavimento', '3/4"', 'ninguno', 'normal', 6.5, 0.46, 0.90, 178, 'ASTM C-39, AGIES 51.01', 'Pavimento medio'),
('2500psi', 'muro', '3/4"', 'ninguno', 'normal', 6.8, 0.45, 0.89, 180, 'ASTM C-39, AGIES 42.01', 'Muro de contención')
ON CONFLICT DO NOTHING;

-- RESISTENCIA 3000 PSI
INSERT INTO erp_dosificaciones_concreto (resistencia, tipo, tamaño_agregado, aditivos, curado, cemento_sacos_m3, arena_m3_m3, piedra_m3_m3, agua_lt_m3, referencia_norma, observaciones) VALUES
-- Cimentaciones
('3000psi', 'cimentacion', '3/4"', 'ninguno', 'normal', 7.0, 0.45, 0.90, 180, 'ASTM C-39, AGIES 42.01', 'Cimentación estándar, 3000psi'),
('3000psi', 'cimentacion', '3/4"', 'impermeabilizante', 'normal', 7.0, 0.45, 0.90, 175, 'ASTM C-39, AGIES 42.01', 'Con impermeabilizante para humedad'),
('3000psi', 'cimentacion', '1"', 'ninguno', 'normal', 7.0, 0.42, 0.85, 180, 'ASTM C-39, AGIES 42.01', 'Cimentación con agregado 1"'),
-- Estructuras
('3000psi', 'estructura', '3/4"', 'ninguno', 'normal', 7.0, 0.45, 0.90, 180, 'ASTM C-39, AGIES 41.01', 'Estructura estándar, 3000psi'),
('3000psi', 'estructura', '3/4"', 'plastificante', 'normal', 6.8, 0.45, 0.90, 178, 'ASTM C-39, AGIES 41.01', 'Con plastificante para trabajabilidad'),
('3000psi', 'estructura', '3/4"', 'ninguno', 'acelerado', 7.0, 0.45, 0.90, 175, 'ASTM C-39, AGIES 41.01', 'Curado acelerado'),
('3000psi', 'estructura', '1"', 'ninguno', 'normal', 7.0, 0.42, 0.85, 180, 'ASTM C-39, AGIES 41.01', 'Estructura estándar, agregado 1"'),
-- Losas
('3000psi', 'losa', '3/4"', 'ninguno', 'normal', 7.5, 0.43, 0.88, 185, 'ASTM C-39, AGIES 42.01', 'Losa estándar'),
('3000psi', 'losa', '3/4"', 'plastificante', 'normal', 7.3, 0.43, 0.88, 182, 'ASTM C-39, AGIES 42.01', 'Losa con plastificante'),
('3000psi', 'losa', '1"', 'ninguno', 'normal', 7.5, 0.40, 0.83, 185, 'ASTM C-39, AGIES 42.01', 'Losa con agregado 1"'),
-- Otros
('3000psi', 'pavimento', '3/4"', 'ninguno', 'normal', 7.0, 0.45, 0.90, 180, 'ASTM C-39, AGIES 51.01', 'Pavimento estándar'),
('3000psi', 'pavimento', '3/4"', 'retardador', 'prolongado', 7.0, 0.45, 0.90, 185, 'ASTM C-39, AGIES 51.01', 'Pavimento con retardador'),
('3000psi', 'muro', '3/4"', 'ninguno', 'normal', 7.2, 0.44, 0.89, 182, 'ASTM C-39, AGIES 41.02', 'Muro estructural')
ON CONFLICT DO NOTHING;

-- RESISTENCIA 3500 PSI
INSERT INTO erp_dosificaciones_concreto (resistencia, tipo, tamaño_agregado, aditivos, curado, cemento_sacos_m3, arena_m3_m3, piedra_m3_m3, agua_lt_m3, referencia_norma, observaciones) VALUES
('3500psi', 'estructura', '3/4"', 'ninguno', 'normal', 7.5, 0.44, 0.88, 182, 'ASTM C-39, AGIES 41.01', 'Estructura reforzada, 3500psi'),
('3500psi', 'estructura', '3/4"', 'plastificante', 'normal', 7.3, 0.44, 0.88, 180, 'ASTM C-39, AGIES 41.01', 'Con plastificante para alta trabajabilidad'),
('3500psi', 'estructura', '1"', 'ninguno', 'normal', 7.5, 0.41, 0.83, 182, 'ASTM C-39, AGIES 41.01', 'Estructura reforzada, agregado 1"'),
('3500psi', 'losa', '3/4"', 'ninguno', 'normal', 8.0, 0.42, 0.86, 188, 'ASTM C-39, AGIES 42.01', 'Losa reforzada'),
('3500psi', 'losa', '1"', 'ninguno', 'normal', 8.0, 0.39, 0.81, 188, 'ASTM C-39, AGIES 42.01', 'Losa reforzada con agregado 1"'),
('3500psi', 'cimentacion', '3/4"', 'impermeabilizante', 'normal', 7.8, 0.43, 0.87, 178, 'ASTM C-39, AGIES 42.01', 'Cimentación impermeabilizada')
ON CONFLICT DO NOTHING;

-- RESISTENCIA 4000 PSI
INSERT INTO erp_dosificaciones_concreto (resistencia, tipo, tamaño_agregado, aditivos, curado, cemento_sacos_m3, arena_m3_m3, piedra_m3_m3, agua_lt_m3, referencia_norma, observaciones) VALUES
('4000psi', 'estructura', '3/4"', 'plastificante', 'normal', 8.5, 0.40, 0.85, 175, 'ASTM C-39, AGIES 41.01', 'Estructura alta resistencia, 4000psi'),
('4000psi', 'estructura', '1"', 'plastificante', 'normal', 8.5, 0.38, 0.82, 175, 'ASTM C-39, AGIES 41.01', 'Estructura alta resistencia, agregado 1"'),
('4000psi', 'estructura', '3/4"', 'plastificante', 'acelerado', 8.5, 0.40, 0.85, 170, 'ASTM C-39, AGIES 41.01', 'Con acelerador para curado rápido'),
('4000psi', 'losa', '1"', 'ninguno', 'normal', 9.0, 0.38, 0.81, 190, 'ASTM C-39, AGIES 42.01', 'Losa alta resistencia'),
('4000psi', 'cimentacion', '3/4"', 'impermeabilizante', 'normal', 8.8, 0.39, 0.84, 172, 'ASTM C-39, AGIES 42.01', 'Cimentación de alta resistencia')
ON CONFLICT DO NOTHING;

-- RESISTENCIA 4500 PSI
INSERT INTO erp_dosificaciones_concreto (resistencia, tipo, tamaño_agregado, aditivos, curado, cemento_sacos_m3, arena_m3_m3, piedra_m3_m3, agua_lt_m3, referencia_norma, observaciones) VALUES
('4500psi', 'estructura', '1/2"', 'plastificante', 'normal', 9.5, 0.38, 0.80, 172, 'ASTM C-39, AGIES 41.01', 'Estructura muy alta resistencia, 4500psi'),
('4500psi', 'estructura', '3/4"', 'plastificante', 'acelerado', 9.5, 0.40, 0.82, 168, 'ASTM C-39, AGIES 41.01', 'Con acelerador'),
('4500psi', 'losa', '1/2"', 'ninguno', 'normal', 10.0, 0.36, 0.79, 192, 'ASTM C-39, AGIES 42.01', 'Losa muy alta resistencia'),
('4500psi', 'cimentacion', '1"', 'impermeabilizante', 'normal', 9.8, 0.37, 0.78, 170, 'ASTM C-39, AGIES 42.01', 'Cimentación muy alta resistencia')
ON CONFLICT DO NOTHING;

-- RESISTENCIA 5000 PSI
INSERT INTO erp_dosificaciones_concreto (resistencia, tipo, tamaño_agregado, aditivos, curado, cemento_sacos_m3, arena_m3_m3, piedra_m3_m3, agua_lt_m3, referencia_norma, observaciones) VALUES
('5000psi', 'estructura', '1/2"', 'plastificante', 'acelerado', 10.0, 0.36, 0.78, 165, 'ASTM C-39, AGIES 41.01', 'Estructura ultra alta resistencia, 5000psi'),
('5000psi', 'estructura', '3/8"', 'plastificante', 'normal', 10.0, 0.34, 0.75, 165, 'ASTM C-39, AGIES 41.01', 'Con agregado fino 3/8"'),
('5000psi', 'losa', '1/2"', 'plastificante', 'normal', 10.5, 0.35, 0.77, 190, 'ASTM C-39, AGIES 42.01', 'Losa ultra alta resistencia'),
('5000psi', 'cimentacion', '1/2"', 'impermeabilizante', 'normal', 10.5, 0.35, 0.77, 168, 'ASTM C-39, AGIES 42.01', 'Cimentación ultra alta resistencia')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. FUNCIÓN DE CÁLCULO DE DOSIFICACIÓN
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_dosificacion(
  p_resistencia text,
  p_tipo text,
  p_tamaño_agregado text,
  p_aditivos text,
  p_curado text,
  p_volumen numeric,
  p_departamento text DEFAULT NULL,
  p_altitud numeric DEFAULT NULL
)
RETURNS TABLE(
  cemento_sacos numeric,
  arena_m3 numeric,
  piedra_m3 numeric,
  agua_lt numeric,
  factor_ajuste numeric,
  costo_total numeric
) AS $$
DECLARE
  v_dosificacion RECORD;
  v_factor_altitud numeric := 1.0;
  v_factor_temperatura numeric := 1.0;
  v_factor_curado numeric := 1.0;
  v_precio_cemento numeric := 92; -- Q/saco (puede actualizarse)
  v_precio_arena numeric := 145; -- Q/m³
  v_precio_piedra numeric := 195; -- Q/m³
BEGIN
  -- Obtener dosificación base
  SELECT * INTO v_dosificacion
  FROM erp_dosificaciones_concreto
  WHERE resistencia = p_resistencia
    AND tipo = p_tipo
    AND tamaño_agregado = p_tamaño_agregado
    AND aditivos = p_aditivos
    AND curado = p_curado
    AND activo = true
  LIMIT 1;

  -- Factor de altitud (Guatemala: 1500msnm es referencia)
  IF p_altitud IS NOT NULL THEN
    IF p_altitud > 2000 THEN
      v_factor_altitud := 1.05; -- Altitud alta: más cemento para curado
    ELSIF p_altitud > 1000 AND p_altitud <= 2000 THEN
      v_factor_altitud := 1.0; -- Altitud media: referencia
    ELSE
      v_factor_altitud := 0.98; -- Altitud baja: menos cemento por calor
    END IF;
  END IF;

  -- Factor de temperatura por departamento (clima afecta curado)
  IF p_departamento IS NOT NULL THEN
    -- Guatemala: 1.0, Escuintla: 0.95 (calor), Quetzaltenango: 1.4 (frío)
    CASE p_departamento
      WHEN 'GT-01' THEN v_factor_temperatura := 1.0;
      WHEN 'GT-02' THEN v_factor_temperatura := 0.95;
      WHEN 'GT-03' THEN v_factor_temperatura := 0.95;
      WHEN 'GT-08' THEN v_factor_temperatura := 1.4;
      WHEN 'GT-12' THEN v_factor_temperatura := 1.5;
      WHEN 'GT-15' THEN v_factor_temperatura := 1.2;
      ELSE v_factor_temperatura := 1.0;
    END CASE;
  END IF;

  -- Factor por tipo de curado
  IF p_curado = 'acelerado' THEN
    v_factor_curado := 1.2; -- Más tiempo de curado
  ELSIF p_curado = 'prolongado' THEN
    v_factor_curado := 1.3; -- Aún más tiempo
  ELSE
    v_factor_curado := 1.0;
  END IF;

  -- Retornar cálculos
  RETURN QUERY
  SELECT
    v_dosificacion.cemento_sacos_m3 * p_volumen * v_factor_altitud * v_factor_curado AS cemento_sacos,
    v_dosificacion.arena_m3_m3 * p_volumen * v_factor_altitud AS arena_m3,
    v_dosificacion.piedra_m3_m3 * p_volumen * v_factor_altitud AS piedra_m3,
    v_dosificacion.agua_lt_m3 * p_volumen * v_factor_temperatura AS agua_lt,
    v_factor_altitud * v_factor_temperatura * v_factor_curado AS factor_ajuste,
    (v_dosificacion.cemento_sacos_m3 * v_precio_cemento +
     v_dosificacion.arena_m3_m3 * v_precio_arena +
     v_dosificacion.piedra_m3_m3 * v_precio_piedra) * p_volumen * v_factor_ajuste AS costo_total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FUNCIÓN PARA OBTENER DOSIFICACIONES POR TIPO
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_dosificaciones_por_tipo(p_tipo text)
RETURNS TABLE(
  resistencia text,
  tamaño_agregado text,
  aditivos text,
  curado text,
  cemento_sacos_m3 numeric,
  arena_m3_m3 numeric,
  piedra_m3_m3 numeric,
  agua_lt_m3
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    resistencia,
    tamaño_agregado,
    aditivos,
    curado,
    cemento_sacos_m3,
    arena_m3_m3,
    piedra_m3_m3,
    agua_lt_m3
  FROM erp_dosificaciones_concreto
  WHERE tipo = p_tipo
    AND activo = true
  ORDER BY 
    CASE resistencia
      WHEN '2000psi' THEN 1
      WHEN '2500psi' THEN 2
      WHEN '3000psi' THEN 3
      WHEN '3500psi' THEN 4
      WHEN '4000psi' THEN 5
      WHEN '4500psi' THEN 6
      WHEN '5000psi' THEN 7
    END,
    tamaño_agregado;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_dosificaciones()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_dosificaciones
BEFORE UPDATE ON erp_dosificaciones_concreto
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_dosificaciones();
