-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 2: DESGLOSE DE ACERO
-- 15 combinaciones (5 elementos × 2 grados × 3 estribos)
-- Versión: 2026-06-19
-- ============================================================

-- ============================================================
-- 1. TABLA DE REFERENCIAS DE ACERO
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_referencias_acero (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  elemento text NOT NULL CHECK (elemento IN ('columna','viga','losa','muro','zapata')),
  grado numeric(3,0) NOT NULL CHECK (grado IN (40,60)),
  estribos text NOT NULL CHECK (estribos IN ('estribos','espiral','malla')),
  total_kg_m3 numeric(6,2) NOT NULL,
  distribucion jsonb NOT NULL,
  alambre_amarre_pct numeric(5,2) NOT NULL,
  desperdicio_pct numeric(5,2) NOT NULL,
  referencia_norma text,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_referencias_acero_combo ON erp_referencias_acero(elemento, grado, estribos);
CREATE INDEX idx_referencias_acero_activas ON erp_referencias_acero(activo);

-- ============================================================
-- 2. TABLA DE PRECIOS DE ACERO
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_precios_acero (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  diametro text NOT NULL CHECK (diametro IN ('3/8','1/2','5/8','3/4','7/8','1')),
  grado numeric(3,0) NOT NULL CHECK (grado IN (40,60)),
  precio_qq numeric(8,2) NOT NULL,
  precio_kg numeric(6,2) NOT NULL,
  referencia_norma text,
  observaciones text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_precios_acero_diametro_grado ON erp_precios_acero(diametro, grado);
CREATE INDEX idx_precios_acero_activos ON erp_precios_acero(activo);

-- ============================================================
-- 3. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_referencias_acero ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_precios_acero ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referencias_acero_read_all" ON erp_referencias_acero FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "precios_acero_read_all" ON erp_precios_acero FOR SELECT TO authenticated USING (activo = true);

-- ============================================================
-- 4. INSERTAR 15 COMBINACIONES DE REFERENCIAS DE ACERO
-- ============================================================

INSERT INTO erp_referencias_acero (elemento, grado, estribos, total_kg_m3, distribucion, alambre_amarre_pct, desperdicio_pct, referencia_norma, observaciones) VALUES
-- COLUMNAS
('columna', 40, 'estribos', 120, '{"3/8": 0.30, "1/2": 0.50, "5/8": 0.20}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna estructural grado 40'),
('columna', 60, 'estribos', 130, '{"3/8": 0.25, "1/2": 0.45, "5/8": 0.30}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna estructural grado 60'),
('columna', 40, 'espiral', 125, '{"1/2": 0.40, "5/8": 0.40, "3/4": 0.20}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna con espiral grado 40'),
('columna', 60, 'espiral', 135, '{"1/2": 0.35, "5/8": 0.40, "3/4": 0.25}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna con espiral grado 60'),
('columna', 40, 'malla', 110, '{"3/8": 0.50, "1/2": 0.40, "5/8": 0.10}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna con malla electrosoldada'),

-- VIGAS
('viga', 40, 'estribos', 140, '{"3/8": 0.25, "1/2": 0.40, "5/8": 0.30, "3/4": 0.05}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga estructural grado 40'),
('viga', 60, 'estribos', 150, '{"3/8": 0.20, "1/2": 0.35, "5/8": 0.35, "3/4": 0.10}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga estructural grado 60'),
('viga', 40, 'estribos', 130, '{"1/2": 0.40, "5/8": 0.45, "3/4": 0.15}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga grado 40, estribos estándar'),
('viga', 60, 'espiral', 145, '{"1/2": 0.35, "5/8": 0.40, "3/4": 0.25}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga con espiral grado 60'),
('viga', 40, 'malla', 120, '{"3/8": 0.40, "1/2": 0.45, "5/8": 0.15}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga con malla'),

-- LOSAS
('losa', 40, 'estribos', 80, '{"3/8": 0.40, "1/2": 0.40, "5/8": 0.20}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Losa reforzada grado 40'),
('losa', 60, 'estribos', 85, '{"3/8": 0.35, "1/2": 0.40, "5/8": 0.25}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Losa reforzada grado 60'),
('losa', 60, 'malla', 75, '{"3/8": 0.40, "1/2": 0.45, "5/8": 0.15}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Losa con malla electrosoldada'),

-- MUROS
('muro', 40, 'estribos', 70, '{"3/8": 0.50, "1/2": 0.40, "5/8": 0.10}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Muro de contención grado 40'),
('muro', 60, 'estribos', 75, '{"3/8": 0.45, "1/2": 0.40, "5/8": 0.15}'::jsonb, 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Muro de contención grado 60');

-- ============================================================
-- 5. INSERTAR 10 PRECIOS REFERENCIALES DE ACERO
-- ============================================================

INSERT INTO erp_precios_acero (diametro, grado, precio_qq, precio_kg, referencia_norma, observaciones) VALUES
('3/8', 40, 450, 49.50, 'ASTM A615, COGUANOR NGO 32107', 'Grado 40, diametro 3/8 pulgadas'),
('3/8', 60, 520, 57.20, 'ASTM A615, COGUANOR NGO 32107', 'Grado 60, diametro 3/8 pulgadas'),
('1/2', 40, 460, 50.60, 'ASTM A615, COGUANOR NGO 32107', 'Grado 40, diametro 1/2 pulgada'),
('1/2', 60, 535, 58.85, 'ASTM A615, COGUANOR NGO 32107', 'Grado 60, diametro 1/2 pulgada'),
('5/8', 40, 475, 52.25, 'ASTM A615, COGUANOR NGO 32107', 'Grado 40, diametro 5/8 pulgadas'),
('5/8', 60, 550, 60.50, 'ASTM A615, COGUANOR NGO 32107', 'Grado 60, diametro 5/8 pulgadas'),
('3/4', 40, 490, 53.90, 'ASTM A615, COGUANOR NGO 32107', 'Grado 40, diametro 3/4 pulgadas'),
('3/4', 60, 570, 62.70, 'ASTM A615, COGUANOR NGO 32107', 'Grado 60, diametro 3/4 pulgadas'),
('7/8', 60, 590, 64.90, 'ASTM A615, COGUANOR NGO 32107', 'Grado 60, diametro 7/8 pulgadas'),
('1', 60, 610, 67.10, 'ASTM A615, COGUANOR NGO 32107', 'Grado 60, diametro 1 pulgada');

-- ============================================================
-- 6. FUNCIÓN PARA CALCULAR DESGLOSE DE ACERO
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_desglose_acero(
  p_elemento text,
  p_grado numeric,
  p_estribos text,
  p_volumen_m3 numeric
)
RETURNS TABLE(
  diametro text,
  cantidad_kg numeric,
  precio_qq numeric,
  precio_unitario_kg numeric,
  costo_total numeric
) AS $$
DECLARE
  v_referencia RECORD;
  v_precio RECORD;
BEGIN
  -- Obtener referencia de acero
  SELECT * INTO v_referencia
  FROM erp_referencias_acero
  WHERE elemento = p_elemento
    AND grado = p_grado
    AND estribos = p_estribos
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    -- Valores por defecto si no se encuentra
    RETURN QUERY
    SELECT
      '1/2' as diametro,
      0 as cantidad_kg,
      0 as precio_qq,
      0 as precio_unitario_kg,
      0 as costo_total;
    RETURN;
  END IF;

  -- Desglose por diámetro
  FOR v_precio IN
    SELECT diametro, precio_qq, precio_kg
    FROM erp_precios_acero
    WHERE grado = p_grado
      AND activo = true
  LOOP
    -- Extraer porcentaje de distribución del JSONB
    DECLARE
      v_porcentaje numeric;
    BEGIN
      SELECT CASE
        WHEN v_precio.diametro = '3/8' THEN (v_referencia.distribucion->>'3/8')::numeric
        WHEN v_precio.diametro = '1/2' THEN (v_referencia.distribucion->>'1/2')::numeric
        WHEN v_precio.diametro = '5/8' THEN (v_referencia.distribucion->>'5/8')::numeric
        WHEN v_precio.diametro = '3/4' THEN (v_referencia.distribucion->>'3/4')::numeric
        WHEN v_precio.diametro = '7/8' THEN (v_referencia.distribucion->>'7/8')::numeric
        WHEN v_precio.diametro = '1' THEN (v_referencia.distribucion->>'1')::numeric
        ELSE 0
      END INTO v_porcentaje;
    EXCEPTION WHEN OTHERS THEN
      v_porcentaje := 0;
    END;

    IF v_porcentaje IS NOT NULL AND v_porcentaje > 0 THEN
      DECLARE
        v_total_kg numeric;
        v_costo numeric;
      BEGIN
        v_total_kg := v_referencia.total_kg_m3 * p_volumen_m3 * v_porcentaje * (1 + v_referencia.desperdicio_pct/100);
        v_costo := v_total_kg * v_precio.precio_kg;

        RETURN QUERY SELECT
          v_precio.diametro,
          v_total_kg,
          v_precio.precio_qq,
          v_precio.precio_kg,
          v_costo;
      END;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. FUNCIÓN PARA OBTENER REFERENCIAS POR ELEMENTO
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_referencias_acero(p_elemento text)
RETURNS TABLE(
  grado numeric,
  estribos text,
  total_kg_m3 numeric,
  alambre_amarre_pct numeric,
  desperdicio_pct numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    grado,
    estribos,
    total_kg_m3,
    alambre_amarre_pct,
    desperdicio_pct
  FROM erp_referencias_acero
  WHERE elemento = p_elemento
    AND activo = true
  ORDER BY grado, estribos;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_acero()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_referencias_acero
BEFORE UPDATE ON erp_referencias_acero
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_acero();

CREATE TRIGGER trigger_actualizar_precios_acero
BEFORE UPDATE ON erp_precios_acero
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_acero();
