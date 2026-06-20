-- ============================================================
-- CONSOLIDADO FASE 3: TABLAS, DATOS Y FUNCIONES SUPABASE
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA DE PAVIMENTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_parametros_pavimentos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  uso text NOT NULL CHECK (uso IN ('peatonal','vehicular_liviano','vehicular_medio','vehicular_pesado')),
  tipo text NOT NULL CHECK (tipo IN ('adoquinado','concreto','asfaltico','interlock','ceramico')),
  espesor_minimo_cm numeric(3,1) NOT NULL,
  costo_base_m2 numeric(8,2) NOT NULL,
  tipo_base text NOT NULL CHECK (tipo_base IN ('c4','piedra_picada','grava','arena')),
  costo_base_m3 numeric(8,2) NOT NULL,
  tipo_sello text NOT NULL CHECK (tipo_sello IN ('arena','cemento','ninguno','asfalto')),
  costo_sello_m2 numeric(6,2) NOT NULL,
  referencia_norma text,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parametros_pavimentos_combo ON erp_parametros_pavimentos(uso, tipo, tipo_base, tipo_sello);
CREATE INDEX IF NOT EXISTS idx_parametros_pavimentos_activas ON erp_parametros_pavimentos(activo);

ALTER TABLE erp_parametros_pavimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parametros_pavimentos_read_all" ON erp_parametros_pavimentos;
CREATE POLICY "parametros_pavimentos_read_all" ON erp_parametros_pavimentos FOR SELECT TO authenticated USING (activo = true);

DROP POLICY IF EXISTS "parametros_pavimentos_insert_all" ON erp_parametros_pavimentos;
CREATE POLICY "parametros_pavimentos_insert_all" ON erp_parametros_pavimentos FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "parametros_pavimentos_update_all" ON erp_parametros_pavimentos;
CREATE POLICY "parametros_pavimentos_update_all" ON erp_parametros_pavimentos FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 2. CREAR TABLA DE REDES DE INFRAESTRUCTURA
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_parametros_redes_infraestructura (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('agua_potable','alcantarillado_sanitario','alcantarillado_pluvial')),
  diametro_pulgadas numeric(4,2) NOT NULL,
  material text NOT NULL CHECK (material IN ('pvc','cpvc','cobre','hdpe','concreto','fierro_fundido')),
  presion text NOT NULL CHECK (presion IN ('baja','media','alta')),
  costo_base_ml numeric(8,2) NOT NULL,
  factor_material numeric(4,2) NOT NULL,
  referencia_norma text,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parametros_redes_combo ON erp_parametros_redes_infraestructura(tipo, diametro_pulgadas, material, presion);
CREATE INDEX IF NOT EXISTS idx_parametros_redes_activas ON erp_parametros_redes_infraestructura(activo);

ALTER TABLE erp_parametros_redes_infraestructura ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parametros_redes_infraestructura_read_all" ON erp_parametros_redes_infraestructura;
CREATE POLICY "parametros_redes_infraestructura_read_all" ON erp_parametros_redes_infraestructura FOR SELECT TO authenticated USING (activo = true);

DROP POLICY IF EXISTS "parametros_redes_infraestructura_insert_all" ON erp_parametros_redes_infraestructura;
CREATE POLICY "parametros_redes_infraestructura_insert_all" ON erp_parametros_redes_infraestructura FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "parametros_redes_infraestructura_update_all" ON erp_parametros_redes_infraestructura;
CREATE POLICY "parametros_redes_infraestructura_update_all" ON erp_parametros_redes_infraestructura FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 3. CREAR TABLA DE MUROS DE CONTENCIÓN
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

ALTER TABLE erp_parametros_muros_contencion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parametros_muros_contencion_read_all" ON erp_parametros_muros_contencion;
CREATE POLICY "parametros_muros_contencion_read_all" ON erp_parametros_muros_contencion FOR SELECT TO authenticated USING (activo = true);

DROP POLICY IF EXISTS "parametros_muros_contencion_insert_all" ON erp_parametros_muros_contencion;
CREATE POLICY "parametros_muros_contencion_insert_all" ON erp_parametros_muros_contencion FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "parametros_muros_contencion_update_all" ON erp_parametros_muros_contencion;
CREATE POLICY "parametros_muros_contencion_update_all" ON erp_parametros_muros_contencion FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 4. INSERTAR DATOS DE PAVIMENTOS (80 combinaciones reducidas a 10 para prueba)
-- ============================================================

INSERT INTO erp_parametros_pavimentos (uso, tipo, espesor_minimo_cm, costo_base_m2, tipo_base, costo_base_m3, tipo_sello, costo_sello_m2, referencia_norma, observaciones, activo) VALUES
('peatonal', 'adoquinado', 8.0, 120.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Pavimento peatonal básico', true),
('peatonal', 'concreto', 10.0, 140.00, 'grava', 160.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto peatonal simple', true),
('peatonal', 'asfaltico', 5.0, 150.00, 'c4', 180.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto peatonal delgado', true),
('vehicular_liviano', 'adoquinado', 12.0, 160.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico liviano', true),
('vehicular_liviano', 'concreto', 15.0, 180.00, 'grava', 160.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico liviano', true),
('vehicular_liviano', 'asfaltico', 8.0, 200.00, 'c4', 180.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico liviano', true),
('vehicular_medio', 'concreto', 20.0, 220.00, 'grava', 160.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico medio', true),
('vehicular_medio', 'asfaltico', 10.0, 250.00, 'c4', 180.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico medio', true),
('vehicular_pesado', 'concreto', 25.0, 280.00, 'grava', 160.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico pesado', true),
('vehicular_pesado', 'asfaltico', 15.0, 320.00, 'c4', 180.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico pesado', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. INSERTAR DATOS DE REDES DE INFRAESTRUCTURA (36 reducidos a 10 para prueba)
-- ============================================================

INSERT INTO erp_parametros_redes_infraestructura (tipo, diametro_pulgadas, material, presion, costo_base_ml, factor_material, referencia_norma, observaciones, activo) VALUES
('agua_potable', 0.5, 'pvc', 'baja', 45.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 0.5" baja presión', true),
('agua_potable', 1.0, 'pvc', 'media', 75.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 1" media presión', true),
('agua_potable', 2.0, 'pvc', 'alta', 130.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 2" alta presión', true),
('agua_potable', 1.0, 'cobre', 'media', 220.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 1" media presión', true),
('agua_potable', 2.0, 'cobre', 'alta', 400.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 2" alta presión', true),
('alcantarillado_sanitario', 4.0, 'concreto', 'baja', 150.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 4" sanitaria', true),
('alcantarillado_sanitario', 6.0, 'concreto', 'media', 270.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 6" sanitaria', true),
('alcantarillado_pluvial', 4.0, 'hdpe', 'baja', 130.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 4" pluvial', true),
('alcantarillado_pluvial', 6.0, 'hdpe', 'media', 230.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 6" pluvial', true),
('alcantarillado_sanitario', 4.0, 'fierro_fundido', 'baja', 200.00, 2.0, 'COGUANOR NGO 41005', 'Tubería fierro fundido 4" sanitaria', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. INSERTAR DATOS DE MUROS DE CONTENCIÓN (25 reducidos a 10 para prueba)
-- ============================================================

INSERT INTO erp_parametros_muros_contencion (altura_m, tipo, tipo_cimentacion, tipo_suelo, tipo_drenaje, costo_base_m2, factor_profundidad, factor_suelo, factor_drenaje, referencia_norma, observaciones, activo) VALUES
(1.0, 'gravedad', 'zapata_corrida', 'arcilla', 'sin_drenaje', 280.00, 1.0, 1.3, 1.0, 'AGIES 62.01', 'Muro gravedad 1m arcilla', true),
(1.5, 'gravedad', 'zapata_corrida', 'arena', 'drenaje_superficial', 320.00, 1.15, 1.1, 1.2, 'AGIES 62.01', 'Muro gravedad 1.5m arena', true),
(2.0, 'gravedad', 'zapata_corrida', 'granular', 'drenaje_interno', 380.00, 1.3, 1.0, 1.1, 'AGIES 62.01', 'Muro gravedad 2m granular', true),
(1.5, 'cantiliver', 'zapata_corrida', 'arcilla', 'drenaje_interno', 380.00, 1.15, 1.3, 1.2, 'AGIES 62.02', 'Muro cantiliver 1.5m', true),
(2.0, 'cantiliver', 'zapata_corrida', 'arena', 'drenaje_completo', 450.00, 1.3, 1.1, 1.3, 'AGIES 62.02', 'Muro cantiliver 2m', true),
(3.0, 'cantiliver', 'pilotes', 'granular', 'drenaje_interno', 550.00, 1.6, 1.0, 1.1, 'AGIES 62.02', 'Muro cantiliver 3m', true),
(2.0, 'atirantado', 'zapata_corrida', 'arena', 'drenaje_interno', 420.00, 1.3, 1.1, 1.1, 'AGIES 62.03', 'Muro atirantado 2m', true),
(3.0, 'atirantado', 'pilotes', 'granular', 'drenaje_completo', 500.00, 1.6, 1.0, 1.3, 'AGIES 62.03', 'Muro atirantado 3m', true),
(3.0, 'tipo celular', 'losa', 'arena', 'sin_drenaje', 480.00, 1.6, 1.1, 1.0, 'AGIES 62.04', 'Muro celular 3m', true),
(4.0, 'pantalla', 'pilotes', 'granular', 'drenaje_interno', 650.00, 1.9, 1.0, 1.1, 'AGIES 62.05', 'Muro pantalla 4m', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. CREAR FUNCIÓN RPC: calcular_pavimento
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_pavimento(
  p_uso text,
  p_tipo text,
  p_tipo_base text,
  p_tipo_sello text,
  p_area_m2 numeric
)
RETURNS TABLE(
  espesor_cm numeric,
  costo_superficie_m2 numeric,
  costo_base_m3 numeric,
  costo_sello_m2 numeric,
  costo_total_m2 numeric,
  costo_total numeric,
  volumen_base_m3 numeric,
  referencia_norma text
) AS $$
DECLARE
  v_parametros RECORD;
  v_costo_total_m2 numeric;
  v_costo_total numeric;
  v_volumen_base_m3 numeric;
BEGIN
  SELECT * INTO v_parametros
  FROM erp_parametros_pavimentos
  WHERE uso = p_uso
    AND tipo = p_tipo
    AND tipo_base = p_tipo_base
    AND tipo_sello = p_tipo_sello
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    v_parametros.espesor_minimo_cm := 10;
    v_parametros.costo_base_m2 := 150;
    v_parametros.costo_base_m3 := 160;
    v_parametros.costo_sello_m2 := 15;
    v_parametros.referencia_norma := 'AGIES 51.02 (default)';
  END IF;

  v_costo_total_m2 := v_parametros.costo_base_m2 + v_parametros.costo_sello_m2;
  v_costo_total := v_costo_total_m2 * p_area_m2;
  v_volumen_base_m3 := (v_parametros.espesor_minimo_cm / 100) * p_area_m2;
  
  RETURN QUERY
  SELECT
    v_parametros.espesor_minimo_cm as espesor_cm,
    v_parametros.costo_base_m2 as costo_superficie_m2,
    v_parametros.costo_base_m3 as costo_base_m3,
    v_parametros.costo_sello_m2 as costo_sello_m2,
    v_costo_total_m2 as costo_total_m2,
    v_costo_total as costo_total,
    v_volumen_base_m3 as volumen_base_m3,
    v_parametros.referencia_norma as referencia_norma;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. CREAR FUNCIÓN RPC: calcular_red_infraestructura
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_red_infraestructura(
  p_tipo text,
  p_diametro_pulgadas numeric,
  p_material text,
  p_presion text,
  p_longitud_ml numeric
)
RETURNS TABLE(
  costo_unitario_ml numeric,
  costo_total numeric,
  factor_ajuste_material numeric,
  referencia_norma text
) AS $$
DECLARE
  v_parametros RECORD;
  v_costo_unitario numeric;
  v_costo_total numeric;
BEGIN
  SELECT * INTO v_parametros
  FROM erp_parametros_redes_infraestructura
  WHERE tipo = p_tipo
    AND diametro_pulgadas = p_diametro_pulgadas
    AND material = p_material
    AND presion = p_presion
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    v_parametros.costo_base_ml := 100;
    v_parametros.factor_material := 1.0;
    v_parametros.referencia_norma := 'COGUANOR NGO 41001 (default)';
  END IF;

  v_costo_unitario := v_parametros.costo_base_ml * v_parametros.factor_material;
  v_costo_total := v_costo_unitario * p_longitud_ml;
  
  RETURN QUERY
  SELECT
    v_costo_unitario as costo_unitario_ml,
    v_costo_total as costo_total,
    v_parametros.factor_material as factor_ajuste_material,
    v_parametros.referencia_norma as referencia_norma;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. CREAR FUNCIÓN RPC: calcular_muro_contencion
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
    v_parametros.costo_base_m2 := 500;
    v_parametros.factor_profundidad := 1.5;
    v_parametros.factor_suelo := 1.1;
    v_parametros.factor_drenaje := 1.0;
    v_parametros.referencia_norma := 'AGIES 62.01 (default)';
  END IF;

  v_factor_total := v_parametros.factor_profundidad * v_parametros.factor_suelo * v_parametros.factor_drenaje;
  v_costo_unitario := v_parametros.costo_base_m2 * v_factor_total;
  v_costo_total := v_costo_unitario * (p_altura_m * p_longitud_m);
  v_volumen_concreto := (p_altura_m * p_longitud_m) * 0.3;
  
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
-- VERIFICACIÓN FINAL
-- ============================================================

SELECT 'Pavimentos' as tabla, COUNT(*) as registros FROM erp_parametros_pavimentos WHERE activo = true
UNION ALL
SELECT 'Redes Infraestructura', COUNT(*) FROM erp_parametros_redes_infraestructura WHERE activo = true
UNION ALL
SELECT 'Muros Contención', COUNT(*) FROM erp_parametros_muros_contencion WHERE activo = true
UNION ALL
SELECT 'Función calcular_pavimento', 1 FROM pg_proc WHERE proname = 'calcular_pavimento'
UNION ALL
SELECT 'Función calcular_red_infraestructura', 1 FROM pg_proc WHERE proname = 'calcular_red_infraestructura'
UNION ALL
SELECT 'Función calcular_muro_contencion', 1 FROM pg_proc WHERE proname = 'calcular_muro_contencion';

-- ============================================================
-- TRIGGERS DE ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_parametros_pavimentos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_parametros_pavimentos ON erp_parametros_pavimentos;
CREATE TRIGGER trigger_actualizar_parametros_pavimentos
BEFORE UPDATE ON erp_parametros_pavimentos
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_parametros_pavimentos();

CREATE OR REPLACE FUNCTION actualizar_timestamp_parametros_redes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_parametros_redes ON erp_parametros_redes_infraestructura;
CREATE TRIGGER trigger_actualizar_parametros_redes
BEFORE UPDATE ON erp_parametros_redes_infraestructura
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_parametros_redes();

CREATE OR REPLACE FUNCTION actualizar_timestamp_parametros_muros()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_parametros_muros ON erp_parametros_muros_contencion;
CREATE TRIGGER trigger_actualizar_parametros_muros
BEFORE UPDATE ON erp_parametros_muros_contencion
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_parametros_muros();