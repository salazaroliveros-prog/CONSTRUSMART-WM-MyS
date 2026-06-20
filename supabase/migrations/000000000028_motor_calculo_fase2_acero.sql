-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 2: REFERENCIAS DE ACERO
-- 15 combinaciones (5 elementos × 2 grados × 3 estribos)
-- Versión: 2026-06-13
-- ============================================================

-- ============================================================
-- 1. TABLA DE REFERENCIAS DE ACERO
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_referencias_acero (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  elemento text NOT NULL CHECK (elemento IN ('columna','viga','losa','cimiento','muro')),
  grado integer NOT NULL CHECK (grado IN (40, 60)),
  estribos text NOT NULL CHECK (estribos IN ('estribos','espiral','malla')),
  total_kg_m3 numeric(6,2) NOT NULL,
  distribucion jsonb NOT NULL,
  alambre_amarre_pct numeric(4,2) DEFAULT 2.00,
  desperdicio_pct numeric(4,2) DEFAULT 5.00,
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
  diametro text NOT NULL CHECK (diametro IN ('3/8"','1/2"','5/8"','3/4"','1"')),
  grado integer NOT NULL CHECK (grado IN (40, 60)),
  precio_quintal numeric(8,2) NOT NULL,
  proveedor text,
  zona text,
  fecha_actualizacion date NOT NULL,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_precios_acero_diametro_grado ON erp_precios_acero(diametro, grado);
CREATE INDEX idx_precios_acero_zona_fecha ON erp_precios_acero(zona, fecha_actualizacion DESC);

-- ============================================================
-- 3. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_referencias_acero ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_precios_acero ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referencias_acero_read_all" ON erp_referencias_acero FOR SELECT TO authenticated USING (activo = true);
CREATE POLICY "precios_acero_read_all" ON erp_precios_acero FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 4. INSERTAR 15 COMBINACIONES DE REFERENCIAS DE ACERO
-- Basadas en normas ACI 318, AGIES 41.01
-- ============================================================

INSERT INTO erp_referencias_acero (elemento, grado, estribos, total_kg_m3, distribucion, alambre_amarre_pct, desperdicio_pct, referencia_norma, observaciones) VALUES
-- COLUMNAS
('columna', 40, 'estribos', 120, '{"3/8\"": 0.30, "1/2\"": 0.50, "5/8\"": 0.20}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna estructural grado 40'),
('columna', 60, 'estribos', 130, '{"3/8\"": 0.25, "1/2\"": 0.45, "5/8\"": 0.30}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna estructural grado 60'),
('columna', 40, 'espiral', 125, '{"1/2\"": 0.40, "5/8\"": 0.40, "3/4\"": 0.20}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna con espiral grado 40'),
('columna', 60, 'espiral', 135, '{"1/2\"": 0.35, "5/8\"": 0.40, "3/4"': 0.25}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna con espiral grado 60'),
('columna', 40, 'malla', 110, '{"3/8\"": 0.50, "1/2\"': 0.40, "5/8"': 0.10}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Columna con malla electrosoldada'),

-- VIGAS
('viga', 40, 'estribos', 140, '{"3/8"': 0.25, "1/2"': 0.40, "5/8"': 0.30, "3/4"': 0.05}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga estructural grado 40'),
('viga', 60, 'estribos', 150, '{"3/8"': 0.20, "1/2"': 0.35, "5/8"': 0.35, "3/4"': 0.10}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga estructural grado 60'),
('viga', 40, 'estribos', 130, '{"1/2"': 0.40, "5/8"': 0.45, "3/4"': 0.15}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga grado 40, estribos estándar'),
('viga', 60, 'espiral', 145, '{"1/2"': 0.35, "5/8"': 0.40, "3/4"': 0.25}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga con espiral grado 60'),
('viga', 40, 'malla', 120, '{"3/8"': 0.40, "1/2"': 0.45, "5/8"': 0.15}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Viga con malla'),

-- LOSAS
('losa', 40, 'estribos', 80, '{"3/8"': 0.40, "1/2"': 0.40, "5/8"': 0.20}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Losa reforzada grado 40'),
('losa', 60, 'estribos', 85, '{"3/8"': 0.35, "1/2"': 0.40, "5/8"': 0.25}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Losa reforzada grado 60'),
('losa', 60, 'malla', 75, '{"3/8"': 0.40, "1/2"': 0.45, "5/8"': 0.15}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Losa con malla electrosoldada'),

-- CIMENTACIONES
('cimiento', 40, 'estribos', 100, '{"3/8"': 0.50, "1/2"': 0.40, "5/8"': 0.10}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Cimiento grado 40'),
('cimiento', 60, 'estribos', 110, '{"3/8"': 0.45, "1/2"': 0.45, "5/8"': 0.10}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Cimiento grado 60'),

-- MUROS
('muro', 40, 'estribos', 90, '{"3/8"': 0.40, "1/2"': 0.45, "5/8"': 0.15}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Muro estructural grado 40'),
('muro', 60, 'estribos', 95, '{"3/8"': 0.35, "1/2"': 0.45, "5/8"': 0.20}', 2.00, 5.00, 'ACI 318, AGIES 41.01', 'Muro estructural grado 60')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. INSERTAR PRECIOS DE ACERO REFERENCIALES
-- Guatemala 2026 - Mercado actual
-- ============================================================

INSERT INTO erp_precios_acero (diametro, grado, precio_quintal, proveedor, zona, fecha_actualizacion, observaciones) VALUES
('3/8"', 40, 285, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 40 estándar'),
('1/2"', 40, 275, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 40 estándar'),
('5/8"', 40, 295, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 40 estándar'),
('3/4"', 40, 310, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 40 estándar'),
('1"', 40, 325, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 40 estándar'),

('3/8"', 60, 295, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 60 alta resistencia'),
('1/2"', 60, 285, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 60 alta resistencia'),
('5/8"', 60, 305, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 60 alta resistencia'),
('3/4"', 60, 320, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 60 alta resistencia'),
('1"', 60, 335, 'Inacasa', 'Guatemala', '2026-06-13', 'Varilla grado 60 alta resistencia')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. FUNCIÓN PARA CALCULAR DESGLOSE DE ACERO
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_desglose_acero(
  p_elemento text,
  p_grado integer,
  p_estribos text,
  p_volumen_concreto numeric
)
RETURNS TABLE(
  desglose jsonb,
  alambre_amarre_kg numeric,
  desperdicio_kg numeric,
  total_kg numeric,
  total_varillas jsonb,
  costo_total numeric,
  costo_por_kg numeric
) AS $$
DECLARE
  v_referencia RECORD;
  v_peso_varilla numeric;
  v_desglose jsonb;
  v_alambre_amarre numeric;
  v_desperdicio numeric;
  v_total_kg numeric;
  v_varillas jsonb;
  v_costo_total numeric;
BEGIN
  SELECT * INTO v_referencia
  FROM erp_referencias_acero
  WHERE elemento = p_elemento
    AND grado = p_grado
    AND estribos = p_estribos
    AND activo = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT '{}'::jsonb, 0, 0, 0, '{}'::jsonb, 0, 0;
  END IF;

  v_alambre_amarre := (v_referencia.total_kg_m3 * p_volumen_concreto) * (v_referencia.alambre_amarre_pct / 100);
  v_desperdicio := (v_referencia.total_kg_m3 * p_volumen_concreto) * (v_referencia.desperdicio_pct / 100);
  v_total_kg := (v_referencia.total_kg_m3 * p_volumen_concreto) + v_desperdicio + v_alambre_amarre;
  
  RETURN QUERY
  SELECT
    v_referencia.distribucion as desglose,
    v_alambre_amarre as alambre_amarre_kg,
    v_desperdicio as desperdicio_kg,
    v_total_kg as total_kg,
    '{}'::jsonb as total_varillas,
    0 as costo_total,
    0 as costo_por_kg;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_referencias_acero()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_referencias_acero
BEFORE UPDATE ON erp_referencias_acero
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_referencias_acero();

CREATE OR REPLACE FUNCTION actualizar_timestamp_precios_acero()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_precios_acero
BEFORE UPDATE ON erp_precios_acero
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_precios_acero();
