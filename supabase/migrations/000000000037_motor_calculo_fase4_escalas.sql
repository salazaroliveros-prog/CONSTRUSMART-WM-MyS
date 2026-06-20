-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 4: ESCALAS DE PRODUCCIÓN
-- Sistema de factores de escala para ajuste por tamaño de proyecto
-- Versión: 2026-06-20
-- ============================================================

-- ============================================================
-- 1. TABLA DE ESCALAS DE PRODUCCIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_escalas_produccion (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipo_proyecto text NOT NULL CHECK (tipo_proyecto IN ('residencial','comercial','industrial','infraestructura','gubernamental','educativo','salud')),
  rango_tamano text NOT NULL CHECK (rango_tamano IN ('pequeno','mediano','grande','muy_grande','mega')),
  tamano_minimo numeric(12,2), -- Presupuesto mínimo en Q
  tamano_maximo numeric(12,2), -- Presupuesto máximo en Q
  factor_economia numeric(5,3) NOT NULL, -- Factor de economía de escala
  factor_administracion numeric(5,3) NOT NULL, -- Factor de overhead administrativo
  factor_imprevistos numeric(5,3) NOT NULL, -- Factor de imprevistos
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_escalas_produccion_combo ON erp_escalas_produccion(tipo_proyecto, rango_tamano);
CREATE INDEX IF NOT EXISTS idx_escalas_produccion_rango ON erp_escalas_produccion(tamano_minimo, tamano_maximo);
CREATE INDEX IF NOT EXISTS idx_escalas_produccion_activas ON erp_escalas_produccion(activo);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_escalas_produccion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "escalas_produccion_read_all" ON erp_escalas_produccion;
CREATE POLICY "escalas_produccion_read_all" ON erp_escalas_produccion FOR SELECT TO authenticated USING (activo = true);

DROP POLICY IF EXISTS "escalas_produccion_insert_all" ON erp_escalas_produccion;
CREATE POLICY "escalas_produccion_insert_all" ON erp_escalas_produccion FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "escalas_produccion_update_all" ON erp_escalas_produccion;
CREATE POLICY "escalas_produccion_update_all" ON erp_escalas_produccion FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 3. INSERTAR ESCALAS DE PRODUCCIÓN REPRESENTATIVAS
-- ============================================================

-- Residencial - Escalas de producción
INSERT INTO erp_escalas_produccion (tipo_proyecto, rango_tamano, tamano_minimo, tamano_maximo, factor_economia, factor_administracion, factor_imprevistos, descripcion, activo) VALUES
('residencial', 'pequeno', 50000, 250000, 1.15, 1.12, 1.08, 'Proyectos residenciales pequeños (vivienda unifamiliar)', true),
('residencial', 'mediano', 250000, 750000, 1.10, 1.10, 1.06, 'Proyectos residenciales medianos (condominios pequeños)', true),
('residencial', 'grande', 750000, 2500000, 1.05, 1.08, 1.05, 'Proyectos residenciales grandes (condominios medianos)', true),
('residencial', 'muy_grande', 2500000, 10000000, 1.02, 1.06, 1.04, 'Proyectos residenciales muy grandes (condominios grandes)', true),
('residencial', 'mega', 10000000, NULL, 1.00, 1.04, 1.03, 'Proyectos residenciales mega (desarrollos urbanísticos)', true);

-- Comercial - Escalas de producción
INSERT INTO erp_escalas_produccion (tipo_proyecto, rango_tamano, tamano_minimo, tamano_maximo, factor_economia, factor_administracion, factor_imprevistos, descripcion, activo) VALUES
('comercial', 'pequeno', 100000, 500000, 1.18, 1.15, 1.10, 'Proyectos comerciales pequeños (locales, oficinas pequeñas)', true),
('comercial', 'mediano', 500000, 2000000, 1.12, 1.12, 1.08, 'Proyectos comerciales medianos (plazas pequeñas, edificios de oficinas)', true),
('comercial', 'grande', 2000000, 8000000, 1.07, 1.09, 1.06, 'Proyectos comerciales grandes (centros comerciales medianos, torres de oficinas)', true),
('comercial', 'muy_grande', 8000000, 30000000, 1.03, 1.07, 1.05, 'Proyectos comerciales muy grandes (centros comerciales grandes, complejos de oficinas)', true),
('comercial', 'mega', 30000000, NULL, 1.00, 1.05, 1.04, 'Proyectos comerciales mega (desarrollos comerciales integrados)', true);

-- Industrial - Escalas de producción
INSERT INTO erp_escalas_produccion (tipo_proyecto, rango_tamano, tamano_minimo, tamano_maximo, factor_economia, factor_administracion, factor_imprevistos, descripcion, activo) VALUES
('industrial', 'pequeno', 200000, 1000000, 1.20, 1.18, 1.12, 'Proyectos industriales pequeños (talleres, galpones pequeños)', true),
('industrial', 'mediano', 1000000, 5000000, 1.14, 1.14, 1.10, 'Proyectos industriales medianos (plantas de manufactura medianas)', true),
('industrial', 'grande', 5000000, 20000000, 1.09, 1.11, 1.08, 'Proyectos industriales grandes (plantas industriales)', true),
('industrial', 'muy_grande', 20000000, 100000000, 1.05, 1.08, 1.06, 'Proyectos industriales muy grandes (complejos industriales)', true),
('industrial', 'mega', 100000000, NULL, 1.02, 1.06, 1.05, 'Proyectos industriales mega (parques industriales)', true);

-- Infraestructura - Escalas de producción
INSERT INTO erp_escalas_produccion (tipo_proyecto, rango_tamano, tamano_minimo, tamano_maximo, factor_economia, factor_administracion, factor_imprevistos, descripcion, activo) VALUES
('infraestructura', 'pequeno', 300000, 1500000, 1.22, 1.20, 1.14, 'Proyectos de infraestructura pequeños (caminos rurales, redes locales)', true),
('infraestructura', 'mediano', 1500000, 8000000, 1.16, 1.16, 1.12, 'Proyectos de infraestructura medianos (caminos departamentales, redes urbanas)', true),
('infraestructura', 'grande', 8000000, 30000000, 1.11, 1.13, 1.10, 'Proyectos de infraestructura grandes (carreteras principales, redes regionales)', true),
('infraestructura', 'muy_grande', 30000000, 150000000, 1.06, 1.10, 1.08, 'Proyectos de infraestructura muy grandes (autopistas, redes nacionales)', true),
('infraestructura', 'mega', 150000000, NULL, 1.03, 1.07, 1.06, 'Proyectos de infraestructura mega (infraestructura nacional)', true);

-- Gubernamental - Escalas de producción
INSERT INTO erp_escalas_produccion (tipo_proyecto, rango_tamano, tamano_minimo, tamano_maximo, factor_economia, factor_administracion, factor_imprevistos, descripcion, activo) VALUES
('gubernamental', 'pequeno', 400000, 2000000, 1.25, 1.22, 1.15, 'Proyectos gubernamentales pequeños (edificios municipales, obras locales)', true),
('gubernamental', 'mediano', 2000000, 10000000, 1.18, 1.18, 1.13, 'Proyectos gubernamentales medianos (edificos departamentales, obras regionales)', true),
('gubernamental', 'grande', 10000000, 50000000, 1.13, 1.15, 1.11, 'Proyectos gubernamentales grandes (edificos ministeriales, obras nacionales)', true),
('gubernamental', 'muy_grande', 50000000, 200000000, 1.08, 1.12, 1.09, 'Proyectos gubernamentales muy grandes (complejos institucionales)', true),
('gubernamental', 'mega', 200000000, NULL, 1.04, 1.09, 1.07, 'Proyectos gubernamentales mega (infraestructura gubernamental nacional)', true);

-- Educativo - Escalas de producción
INSERT INTO erp_escalas_produccion (tipo_proyecto, rango_tamano, tamano_minimo, tamano_maximo, factor_economia, factor_administracion, factor_imprevistos, descripcion, activo) VALUES
('educativo', 'pequeno', 300000, 1200000, 1.19, 1.17, 1.11, 'Proyectos educativos pequeños (escuelas rurales, aulas)', true),
('educativo', 'mediano', 1200000, 5000000, 1.13, 1.13, 1.09, 'Proyectos educativos medianos (institutos, colegios medianos)', true),
('educativo', 'grande', 5000000, 20000000, 1.08, 1.10, 1.07, 'Proyectos educativos grandes (universidades, colegios grandes)', true),
('educativo', 'muy_grande', 20000000, 80000000, 1.04, 1.08, 1.06, 'Proyectos educativos muy grandes (campus universitarios)', true),
('educativo', 'mega', 80000000, NULL, 1.01, 1.06, 1.05, 'Proyectos educativos mega (sistemas educativos regionales)', true);

-- Salud - Escalas de producción
INSERT INTO erp_escalas_produccion (tipo_proyecto, rango_tamano, tamano_minimo, tamano_maximo, factor_economia, factor_administracion, factor_imprevistos, descripcion, activo) VALUES
('salud', 'pequeno', 500000, 2500000, 1.21, 1.19, 1.13, 'Proyectos de salud pequeños (puestos de salud, clínicas rurales)', true),
('salud', 'mediano', 2500000, 10000000, 1.15, 1.15, 1.11, 'Proyectos de salud medianos (centros de salud, hospitales pequeños)', true),
('salud', 'grande', 10000000, 40000000, 1.10, 1.12, 1.09, 'Proyectos de salud grandes (hospitales regionales)', true),
('salud', 'muy_grande', 40000000, 150000000, 1.05, 1.09, 1.07, 'Proyectos de salud muy grandes (hospitales nacionales, centros médicos)', true),
('salud', 'mega', 150000000, NULL, 1.02, 1.07, 1.06, 'Proyectos de salud mega (sistemas de salud nacionales)', true);

-- ============================================================
-- 4. FUNCIÓN PARA OBTENER ESCALA POR PRESUPUESTO
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_escala_produccion(
  p_tipo_proyecto text,
  p_presupuesto numeric
)
RETURNS TABLE(
  id uuid,
  tipo_proyecto text,
  rango_tamano text,
  factor_economia numeric,
  factor_administracion numeric,
  factor_imprevistos numeric,
  descripcion text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    tipo_proyecto,
    rango_tamano,
    factor_economia,
    factor_administracion,
    factor_imprevistos,
    descripcion
  FROM erp_escalas_produccion
  WHERE tipo_proyecto = p_tipo_proyecto
    AND (tamano_minimo IS NULL OR p_presupuesto >= tamano_minimo)
    AND (tamano_maximo IS NULL OR p_presupuesto <= tamano_maximo)
    AND activo = true
  ORDER BY rango_tamano
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FUNCIÓN PARA APLICAR FACTORES DE ESCALA A PRESUPUESTO
-- ============================================================

CREATE OR REPLACE FUNCTION aplicar_factores_escala(
  p_tipo_proyecto text,
  p_presupuesto_base numeric,
  p_costo_directo numeric
)
RETURNS TABLE(
  presupuesto_base numeric,
  costo_ajustado numeric,
  factor_economia_aplicado numeric,
  factor_administracion_aplicado numeric,
  factor_imprevistos_aplicado numeric,
  factor_total numeric,
  presupuesto_final numeric,
  escala_identificada text
) AS $$
DECLARE
  v_escala RECORD;
  v_factor_total numeric;
  v_costo_ajustado numeric;
  v_presupuesto_final numeric;
BEGIN
  -- Obtener escala de producción
  SELECT * INTO v_escala FROM obtener_escala_produccion(p_tipo_proyecto, p_presupuesto_base);
  
  IF NOT FOUND THEN
    -- Si no se encuentra escala, usar valores por defecto (mediano)
    v_escala.factor_economia := 1.10;
    v_escala.factor_administracion := 1.12;
    v_escala.factor_imprevistos := 1.08;
    v_escala.rango_tamano := 'desconocido';
  END IF;
  
  -- Calcular factor total
  v_factor_total := v_escala.factor_economia * v_escala.factor_administracion * v_escala.factor_imprevistos;
  
  -- Aplicar factores al costo directo
  v_costo_ajustado := p_costo_directo * v_escala.factor_economia;
  v_presupuesto_final := v_costo_ajustado * v_escala.factor_administracion * v_escala.factor_imprevistos;
  
  RETURN QUERY
  SELECT
    p_presupuesto_base as presupuesto_base,
    v_costo_ajustado as costo_ajustado,
    v_escala.factor_economia as factor_economia_aplicado,
    v_escala.factor_administracion as factor_administracion_aplicado,
    v_escala.factor_imprevistos as factor_imprevistos_aplicado,
    v_factor_total as factor_total,
    v_presupuesto_final as presupuesto_final,
    v_escala.rango_tamano as escala_identificada;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. TRIGGER DE ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_escalas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_escalas ON erp_escalas_produccion;
CREATE TRIGGER trigger_actualizar_escalas
BEFORE UPDATE ON erp_escalas_produccion
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_escalas();

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT 'Tabla escalas_produccion' as componente, COUNT(*) as total FROM erp_escalas_produccion
UNION ALL
SELECT 'Función obtener_escala_produccion', 1 FROM pg_proc WHERE proname = 'obtener_escala_produccion'
UNION ALL
SELECT 'Función aplicar_factores_escala', 1 FROM pg_proc WHERE proname = 'aplicar_factores_escala';