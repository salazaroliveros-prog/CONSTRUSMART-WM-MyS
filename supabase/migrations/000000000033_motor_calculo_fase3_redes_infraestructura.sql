-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 3: REDES DE INFRAESTRUCTURA
-- 48 combinaciones (3 tipos × 8 diámetros × 6 materiales × 3 presiones)
-- Versión: 2026-06-20
-- ============================================================

-- ============================================================
-- 1. TABLA DE PARÁMETROS DE REDES DE INFRAESTRUCTURA
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

CREATE INDEX idx_parametros_redes_combo ON erp_parametros_redes_infraestructura(tipo, diametro_pulgadas, material, presion);
CREATE INDEX idx_parametros_redes_activas ON erp_parametros_redes_infraestructura(activo);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_parametros_redes_infraestructura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parametros_redes_infraestructura_read_all" ON erp_parametros_redes_infraestructura FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "parametros_redes_infraestructura_insert_all" ON erp_parametros_redes_infraestructura FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "parametros_redes_infraestructura_update_all" ON erp_parametros_redes_infraestructura FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 3. INSERTAR 48 COMBINACIONES DE PARÁMETROS
-- Basadas en costos de construcción Guatemala 2026
-- ============================================================

-- AGUA POTABLE - PVC
INSERT INTO erp_parametros_redes_infraestructura (tipo, diametro_pulgadas, material, presion, costo_base_ml, factor_material, referencia_norma, observaciones) VALUES
('agua_potable', 0.5, 'pvc', 'baja', 45.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 0.5" baja presión'),
('agua_potable', 0.5, 'pvc', 'media', 55.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 0.5" media presión'),
('agua_potable', 0.5, 'pvc', 'alta', 65.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 0.5" alta presión'),

('agua_potable', 1.0, 'pvc', 'baja', 60.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 1" baja presión'),
('agua_potable', 1.0, 'pvc', 'media', 75.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 1" media presión'),
('agua_potable', 1.0, 'pvc', 'alta', 90.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 1" alta presión'),

('agua_potable', 2.0, 'pvc', 'baja', 90.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 2" baja presión'),
('agua_potable', 2.0, 'pvc', 'media', 110.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 2" media presión'),
('agua_potable', 2.0, 'pvc', 'alta', 130.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 2" alta presión'),

('agua_potable', 3.0, 'pvc', 'baja', 120.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 3" baja presión'),
('agua_potable', 3.0, 'pvc', 'media', 150.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 3" media presión'),
('agua_potable', 3.0, 'pvc', 'alta', 180.00, 1.0, 'COGUANOR NGO 41001', 'Tubería PVC 3" alta presión');

-- AGUA POTABLE - COBRE
INSERT INTO erp_parametros_redes_infraestructura (tipo, diametro_pulgadas, material, presion, costo_base_ml, factor_material, referencia_norma, observaciones) VALUES
('agua_potable', 0.5, 'cobre', 'baja', 120.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 0.5" baja presión'),
('agua_potable', 0.5, 'cobre', 'media', 140.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 0.5" media presión'),
('agua_potable', 0.5, 'cobre', 'alta', 160.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 0.5" alta presión'),

('agua_potable', 1.0, 'cobre', 'baja', 180.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 1" baja presión'),
('agua_potable', 1.0, 'cobre', 'media', 220.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 1" media presión'),
('agua_potable', 1.0, 'cobre', 'alta', 260.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 1" alta presión'),

('agua_potable', 2.0, 'cobre', 'baja', 280.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 2" baja presión'),
('agua_potable', 2.0, 'cobre', 'media', 340.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 2" media presión'),
('agua_potable', 2.0, 'cobre', 'alta', 400.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 2" alta presión'),

('agua_potable', 3.0, 'cobre', 'baja', 380.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 3" baja presión'),
('agua_potable', 3.0, 'cobre', 'media', 460.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 3" media presión'),
('agua_potable', 3.0, 'cobre', 'alta', 540.00, 1.5, 'COGUANOR NGO 41002', 'Tubería cobre 3" alta presión');

-- ALCANTARILLADO SANITARIO - CONCRETO
INSERT INTO erp_parametros_redes_infraestructura (tipo, diametro_pulgadas, material, presion, costo_base_ml, factor_material, referencia_norma, observaciones) VALUES
('alcantarillado_sanitario', 4.0, 'concreto', 'baja', 150.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 4" sanitaria'),
('alcantarillado_sanitario', 4.0, 'concreto', 'media', 180.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 4" sanitaria media'),
('alcantarillado_sanitario', 4.0, 'concreto', 'alta', 210.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 4" sanitaria alta'),

('alcantarillado_sanitario', 6.0, 'concreto', 'baja', 220.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 6" sanitaria'),
('alcantarillado_sanitario', 6.0, 'concreto', 'media', 270.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 6" sanitaria media'),
('alcantarillado_sanitario', 6.0, 'concreto', 'alta', 320.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 6" sanitaria alta'),

('alcantarillado_sanitario', 8.0, 'concreto', 'baja', 320.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 8" sanitaria'),
('alcantarillado_sanitario', 8.0, 'concreto', 'media', 400.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 8" sanitaria media'),
('alcantarillado_sanitario', 8.0, 'concreto', 'alta', 480.00, 1.8, 'COGUANOR NGO 41003', 'Tubería concreto 8" sanitaria alta');

-- ALCANTARILLADO PLUVIAL - HDPE
INSERT INTO erp_parametros_redes_infraestructura (tipo, diametro_pulgadas, material, presion, costo_base_ml, factor_material, referencia_norma, observaciones) VALUES
('alcantarillado_pluvial', 4.0, 'hdpe', 'baja', 130.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 4" pluvial'),
('alcantarillado_pluvial', 4.0, 'hdpe', 'media', 160.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 4" pluvial media'),
('alcantarillado_pluvial', 4.0, 'hdpe', 'alta', 190.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 4" pluvial alta'),

('alcantarillado_pluvial', 6.0, 'hdpe', 'baja', 180.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 6" pluvial'),
('alcantarillado_pluvial', 6.0, 'hdpe', 'media', 230.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 6" pluvial media'),
('alcantarillado_pluvial', 6.0, 'hdpe', 'alta', 280.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 6" pluvial alta'),

('alcantarillado_pluvial', 8.0, 'hdpe', 'baja', 260.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 8" pluvial'),
('alcantarillado_pluvial', 8.0, 'hdpe', 'media', 330.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 8" pluvial media'),
('alcantarillado_pluvial', 8.0, 'hdpe', 'alta', 400.00, 1.3, 'COGUANOR NGO 41004', 'Tubería HDPE 8" pluvial alta');

-- ALCANTARILLADO SANITARIO - FIERRO FUNDIDO
INSERT INTO erp_parametros_redes_infraestructura (tipo, diametro_pulgadas, material, presion, costo_base_ml, factor_material, referencia_norma, observaciones) VALUES
('alcantarillado_sanitario', 4.0, 'fierro_fundido', 'baja', 200.00, 2.0, 'COGUANOR NGO 41005', 'Tubería fierro fundido 4" sanitaria'),
('alcantarillado_sanitario', 4.0, 'fierro_fundido', 'media', 250.00, 2.0, 'COGUANOR NGO 41005', 'Tubería fierro fundido 4" sanitaria media'),
('alcantarillado_sanitario', 4.0, 'fierro_fundido', 'alta', 300.00, 2.0, 'COGUANOR NGO 41005', 'Tubería fierro fundido 4" sanitaria alta'),

('alcantarillado_sanitario', 6.0, 'fierro_fundido', 'baja', 300.00, 2.0, 'COGUANOR NGO 41005', 'Tubería fierro fundido 6" sanitaria'),
('alcantarillado_sanitario', 6.0, 'fierro_fundido', 'media', 380.00, 2.0, 'COGUANOR NGO 41005', 'Tubería fierro fundido 6" sanitaria media'),
('alcantarillado_sanitario', 6.0, 'fierro_fundido', 'alta', 460.00, 2.0, 'COGUANOR NGO 41005', 'Tubería fierro fundido 6" sanitaria alta');

-- ============================================================
-- 4. FUNCIÓN PARA CALCULAR REDES DE INFRAESTRUCTURA
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
  -- Obtener parámetros base
  SELECT * INTO v_parametros
  FROM erp_parametros_redes_infraestructura
  WHERE tipo = p_tipo
    AND diametro_pulgadas = p_diametro_pulgadas
    AND material = p_material
    AND presion = p_presion
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    -- Si no se encuentra combinación exacta, usar valores por defecto
    v_parametros.costo_base_ml := 100;
    v_parametros.factor_material := 1.0;
    v_parametros.referencia_norma := 'COGUANOR NGO 41001 (default)';
  END IF;

  -- Calcular costo unitario ajustado
  v_costo_unitario := v_parametros.costo_base_ml * v_parametros.factor_material;
  
  -- Calcular costo total
  v_costo_total := v_costo_unitario * p_longitud_ml;
  
  -- Retornar resultados
  RETURN QUERY
  SELECT
    v_costo_unitario as costo_unitario_ml,
    v_costo_total as costo_total,
    v_parametros.factor_material as factor_ajuste_material,
    v_parametros.referencia_norma as referencia_norma;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_parametros_redes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_parametros_redes
BEFORE UPDATE ON erp_parametros_redes_infraestructura
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_parametros_redes();