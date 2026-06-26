-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 3: PAVIMENTOS
-- 80 combinaciones (4 usos × 5 tipos × 4 bases × 4 sellos)
-- Versión: 2026-06-20
-- ============================================================

-- ============================================================
-- 1. TABLA DE PARÁMETROS DE PAVIMENTOS
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

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_parametros_pavimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parametros_pavimentos_read_all" ON erp_parametros_pavimentos FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "parametros_pavimentos_insert_all" ON erp_parametros_pavimentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "parametros_pavimentos_update_all" ON erp_parametros_pavimentos FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 3. INSERTAR 80 COMBINACIONES DE PARÁMETROS
-- Basadas en costos de construcción Guatemala 2026
-- ============================================================

-- USO PEATONAL
INSERT INTO erp_parametros_pavimentos (uso, tipo, espesor_minimo_cm, costo_base_m2, tipo_base, costo_base_m3, tipo_sello, costo_sello_m2, referencia_norma, observaciones) VALUES
('peatonal', 'adoquinado', 8.0, 120.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Pavimento peatonal básico'),
('peatonal', 'adoquinado', 8.0, 120.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Pavimento peatonal con sello cemento'),
('peatonal', 'adoquinado', 8.0, 120.00, 'piedra_picada', 150.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Pavimento peatonal base piedra'),
('peatonal', 'adoquinado', 8.0, 120.00, 'piedra_picada', 150.00, 'cemento', 25.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Pavimento peatonal base piedra sello cemento'),

('peatonal', 'concreto', 10.0, 140.00, 'grava', 160.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto peatonal simple'),
('peatonal', 'concreto', 10.0, 140.00, 'grava', 160.00, 'cemento', 20.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto peatonal con acabado cemento'),
('peatonal', 'concreto', 10.0, 140.00, 'arena', 140.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto peatonal base arena'),
('peatonal', 'concreto', 10.0, 140.00, 'arena', 140.00, 'cemento', 20.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto peatonal base arena acabado cemento'),

('peatonal', 'asfaltico', 5.0, 150.00, 'c4', 180.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto peatonal delgado'),
('peatonal', 'asfaltico', 5.0, 150.00, 'piedra_picada', 150.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto peatonal base piedra'),
('peatonal', 'asfaltico', 5.0, 150.00, 'grava', 160.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto peatonal base grava'),
('peatonal', 'asfaltico', 5.0, 150.00, 'arena', 140.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto peatonal base arena'),

('peatonal', 'interlock', 6.0, 180.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock peatonal'),
('peatonal', 'interlock', 6.0, 180.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock peatonal sello cemento'),
('peatonal', 'interlock', 6.0, 180.00, 'piedra_picada', 150.00, 'arena', 15.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock peatonal base piedra'),
('peatonal', 'interlock', 6.0, 180.00, 'piedra_picada', 150.00, 'cemento', 25.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock peatonal base piedra sello cemento'),

('peatonal', 'ceramico', 5.0, 200.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico peatonal'),
('peatonal', 'ceramico', 5.0, 200.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico peatonal sello cemento'),
('peatonal', 'ceramico', 5.0, 200.00, 'grava', 160.00, 'arena', 15.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico peatonal base grava'),
('peatonal', 'ceramico', 5.0, 200.00, 'grava', 160.00, 'cemento', 25.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico peatonal base grava sello cemento');

-- USO VEHICULAR LIVIANO
INSERT INTO erp_parametros_pavimentos (uso, tipo, espesor_minimo_cm, costo_base_m2, tipo_base, costo_base_m3, tipo_sello, costo_sello_m2, referencia_norma, observaciones) VALUES
('vehicular_liviano', 'adoquinado', 12.0, 160.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico liviano'),
('vehicular_liviano', 'adoquinado', 12.0, 160.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico liviano sello cemento'),
('vehicular_liviano', 'adoquinado', 12.0, 160.00, 'piedra_picada', 150.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico liviano base piedra'),
('vehicular_liviano', 'adoquinado', 12.0, 160.00, 'piedra_picada', 150.00, 'cemento', 25.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico liviano base piedra sello cemento'),

('vehicular_liviano', 'concreto', 15.0, 180.00, 'grava', 160.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico liviano'),
('vehicular_liviano', 'concreto', 15.0, 180.00, 'grava', 160.00, 'cemento', 20.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico liviano acabado cemento'),
('vehicular_liviano', 'concreto', 15.0, 180.00, 'arena', 140.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico liviano base arena'),
('vehicular_liviano', 'concreto', 15.0, 180.00, 'arena', 140.00, 'cemento', 20.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico liviano base arena acabado cemento'),

('vehicular_liviano', 'asfaltico', 8.0, 200.00, 'c4', 180.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico liviano'),
('vehicular_liviano', 'asfaltico', 8.0, 200.00, 'piedra_picada', 150.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico liviano base piedra'),
('vehicular_liviano', 'asfaltico', 8.0, 200.00, 'grava', 160.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico liviano base grava'),
('vehicular_liviano', 'asfaltico', 8.0, 200.00, 'arena', 140.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico liviano base arena'),

('vehicular_liviano', 'interlock', 10.0, 220.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico liviano'),
('vehicular_liviano', 'interlock', 10.0, 220.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico liviano sello cemento'),
('vehicular_liviano', 'interlock', 10.0, 220.00, 'piedra_picada', 150.00, 'arena', 15.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico liviano base piedra'),
('vehicular_liviano', 'interlock', 10.0, 220.00, 'piedra_picada', 150.00, 'cemento', 25.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico liviano base piedra sello cemento'),

('vehicular_liviano', 'ceramico', 8.0, 250.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico liviano'),
('vehicular_liviano', 'ceramico', 8.0, 250.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico liviano sello cemento'),
('vehicular_liviano', 'ceramico', 8.0, 250.00, 'grava', 160.00, 'arena', 15.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico liviano base grava'),
('vehicular_liviano', 'ceramico', 8.0, 250.00, 'grava', 160.00, 'cemento', 25.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico liviano base grava sello cemento');

-- USO VEHICULAR MEDIO
INSERT INTO erp_parametros_pavimentos (uso, tipo, espesor_minimo_cm, costo_base_m2, tipo_base, costo_base_m3, tipo_sello, costo_sello_m2, referencia_norma, observaciones) VALUES
('vehicular_medio', 'adoquinado', 15.0, 200.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico medio'),
('vehicular_medio', 'adoquinado', 15.0, 200.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico medio sello cemento'),
('vehicular_medio', 'adoquinado', 15.0, 200.00, 'piedra_picada', 150.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico medio base piedra'),
('vehicular_medio', 'adoquinado', 15.0, 200.00, 'piedra_picada', 150.00, 'cemento', 25.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico medio base piedra sello cemento'),

('vehicular_medio', 'concreto', 20.0, 220.00, 'grava', 160.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico medio'),
('vehicular_medio', 'concreto', 20.0, 220.00, 'grava', 160.00, 'cemento', 20.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico medio acabado cemento'),
('vehicular_medio', 'concreto', 20.0, 220.00, 'arena', 140.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico medio base arena'),
('vehicular_medio', 'concreto', 20.0, 220.00, 'arena', 140.00, 'cemento', 20.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico medio base arena acabado cemento'),

('vehicular_medio', 'asfaltico', 10.0, 250.00, 'c4', 180.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico medio'),
('vehicular_medio', 'asfaltico', 10.0, 250.00, 'piedra_picada', 150.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico medio base piedra'),
('vehicular_medio', 'asfaltico', 10.0, 250.00, 'grava', 160.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico medio base grava'),
('vehicular_medio', 'asfaltico', 10.0, 250.00, 'arena', 140.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico medio base arena'),

('vehicular_medio', 'interlock', 12.0, 280.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico medio'),
('vehicular_medio', 'interlock', 12.0, 280.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico medio sello cemento'),
('vehicular_medio', 'interlock', 12.0, 280.00, 'piedra_picada', 150.00, 'arena', 15.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico medio base piedra'),
('vehicular_medio', 'interlock', 12.0, 280.00, 'piedra_picada', 150.00, 'cemento', 25.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico medio base piedra sello cemento'),

('vehicular_medio', 'ceramico', 10.0, 300.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico medio'),
('vehicular_medio', 'ceramico', 10.0, 300.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico medio sello cemento'),
('vehicular_medio', 'ceramico', 10.0, 300.00, 'grava', 160.00, 'arena', 15.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico medio base grava'),
('vehicular_medio', 'ceramico', 10.0, 300.00, 'grava', 160.00, 'cemento', 25.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico medio base grava sello cemento');

-- USO VEHICULAR PESADO
INSERT INTO erp_parametros_pavimentos (uso, tipo, espesor_minimo_cm, costo_base_m2, tipo_base, costo_base_m3, tipo_sello, costo_sello_m2, referencia_norma, observaciones) VALUES
('vehicular_pesado', 'adoquinado', 18.0, 240.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico pesado'),
('vehicular_pesado', 'adoquinado', 18.0, 240.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico pesado sello cemento'),
('vehicular_pesado', 'adoquinado', 18.0, 240.00, 'piedra_picada', 150.00, 'arena', 15.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico pesado base piedra'),
('vehicular_pesado', 'adoquinado', 18.0, 240.00, 'piedra_picada', 150.00, 'cemento', 25.00, 'AGIES 51.01, COGUANOR NGO 34001', 'Adoquinado tráfico pesado base piedra sello cemento'),

('vehicular_pesado', 'concreto', 25.0, 280.00, 'grava', 160.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico pesado'),
('vehicular_pesado', 'concreto', 25.0, 280.00, 'grava', 160.00, 'cemento', 20.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico pesado acabado cemento'),
('vehicular_pesado', 'concreto', 25.0, 280.00, 'arena', 140.00, 'ninguno', 0.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico pesado base arena'),
('vehicular_pesado', 'concreto', 25.0, 280.00, 'arena', 140.00, 'cemento', 20.00, 'AGIES 51.02, COGUANOR NGO 34002', 'Concreto tráfico pesado base arena acabado cemento'),

('vehicular_pesado', 'asfaltico', 15.0, 320.00, 'c4', 180.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico pesado'),
('vehicular_pesado', 'asfaltico', 15.0, 320.00, 'piedra_picada', 150.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico pesado base piedra'),
('vehicular_pesado', 'asfaltico', 15.0, 320.00, 'grava', 160.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico pesado base grava'),
('vehicular_pesado', 'asfaltico', 15.0, 320.00, 'arena', 140.00, 'asfalto', 0.00, 'AGIES 51.03, COGUANOR NGO 34003', 'Asfalto tráfico pesado base arena'),

('vehicular_pesado', 'interlock', 15.0, 350.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico pesado'),
('vehicular_pesado', 'interlock', 15.0, 350.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico pesado sello cemento'),
('vehicular_pesado', 'interlock', 15.0, 350.00, 'piedra_picada', 150.00, 'arena', 15.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico pesado base piedra'),
('vehicular_pesado', 'interlock', 15.0, 350.00, 'piedra_picada', 150.00, 'cemento', 25.00, 'AGIES 51.04, COGUANOR NGO 34004', 'Interlock tráfico pesado base piedra sello cemento'),

('vehicular_pesado', 'ceramico', 12.0, 400.00, 'c4', 180.00, 'arena', 15.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico pesado'),
('vehicular_pesado', 'ceramico', 12.0, 400.00, 'c4', 180.00, 'cemento', 25.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico pesado sello cemento'),
('vehicular_pesado', 'ceramico', 12.0, 400.00, 'grava', 160.00, 'arena', 15.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico pesado base grava'),
('vehicular_pesado', 'ceramico', 12.0, 400.00, 'grava', 160.00, 'cemento', 25.00, 'AGIES 51.05, COGUANOR NGO 34005', 'Cerámico tráfico pesado base grava sello cemento');

-- ============================================================
-- 4. FUNCIÓN PARA CALCULAR PAVIMENTOS
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
  -- Obtener parámetros base
  SELECT * INTO v_parametros
  FROM erp_parametros_pavimentos
  WHERE uso = p_uso
    AND tipo = p_tipo
    AND tipo_base = p_tipo_base
    AND tipo_sello = p_tipo_sello
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    -- Si no se encuentra combinación exacta, usar valores por defecto
    v_parametros.espesor_minimo_cm := 10;
    v_parametros.costo_base_m2 := 150;
    v_parametros.costo_base_m3 := 160;
    v_parametros.costo_sello_m2 := 15;
    v_parametros.referencia_norma := 'AGIES 51.02 (default)';
  END IF;

  -- Calcular costo total por m²
  v_costo_total_m2 := v_parametros.costo_base_m2 + v_parametros.costo_sello_m2;
  
  -- Calcular costo total para el área
  v_costo_total := v_costo_total_m2 * p_area_m2;
  
  -- Calcular volumen de base (espesor * área / 100 para convertir cm a m)
  v_volumen_base_m3 := (v_parametros.espesor_minimo_cm / 100) * p_area_m2;
  
  -- Retornar resultados
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
-- 5. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_parametros_pavimentos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_parametros_pavimentos
BEFORE UPDATE ON erp_parametros_pavimentos
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_parametros_pavimentos();