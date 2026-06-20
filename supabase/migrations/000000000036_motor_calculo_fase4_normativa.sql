-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 4: NORMATIVA DEPARTAMENTAL
-- Sistema de normativa técnica por departamento para Guatemala
-- Versión: 2026-06-20
-- ============================================================

-- ============================================================
-- 1. TABLA DE NORMATIVA DEPARTAMENTAL
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_normativa_departamental (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  departamento_codigo text NOT NULL CHECK (departamento_codigo IN ('GT-01','GT-02','GT-03','GT-04','GT-05','GT-06','GT-07','GT-08','GT-09','GT-10','GT-11','GT-12','GT-13','GT-14','GT-15','GT-16','GT-17','GT-18','GT-19','GT-20','GT-21','GT-22')),
  tipo_norma text NOT NULL CHECK (tipo_norma IN ('estructural','urbanistica','ambiental','sismica','electrica','sanitaria')),
  codigo_norma text NOT NULL,
  nombre_norma text NOT NULL,
  descripcion text,
  ano_ultima_revision integer,
  organismo_emisor text,
  requisitos_especificos jsonb, -- Requisitos técnicos específicos
  aplicacion text, -- Contexto de aplicación
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_normativa_departamento_combo ON erp_normativa_departamental(departamento_codigo, tipo_norma);
CREATE INDEX IF NOT EXISTS idx_normativa_departamento_codigo ON erp_normativa_departamental(codigo_norma);
CREATE INDEX IF NOT EXISTS idx_normativa_departamento_activa ON erp_normativa_departamental(activo);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_normativa_departamental ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "normativa_departamental_read_all" ON erp_normativa_departamental;
CREATE POLICY "normativa_departamental_read_all" ON erp_normativa_departamental FOR SELECT TO authenticated USING (activo = true);

DROP POLICY IF EXISTS "normativa_departamental_insert_all" ON erp_normativa_departamental;
CREATE POLICY "normativa_departamental_insert_all" ON erp_normativa_departamental FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "normativa_departamental_update_all" ON erp_normativa_departamental;
CREATE POLICY "normativa_departamento_update_all" ON erp_normativa_departamental FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 3. INSERTAR NORMATIVA REPRESENTATIVA PARA 10 DEPARTAMENTOS PRINCIPALES
-- ============================================================

-- Guatemala (GT-01) - Normativa estructural
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-01', 'estructural', 'AGIES-41', 'Norma de Diseño Estructural', 'Normativa para diseño estructural de edificaciones en Guatemala', 2021, 'AGIES', '{"carga_viva": "2.5 kPa", "viento": "0.35 kPa", "sismo": "Zona 3"}', 'Aplicable a todo el departamento', true),
('GT-01', 'urbanistica', 'NU-2020', 'Normas de Ordenamiento Urbanístico', 'Regulación de uso de suelo y zonificación', 2020, 'Municipal', '{"uso_suelo": "residencial", "densidad": "150 hab/ha", "altura_max": "15m"}', 'Ordenamiento territorial municipal', true),
('GT-01', 'sismica', 'COGUANOR-741', 'Norma de Diseño Sísmico', 'Requisitos para diseño sismorresistente', 2018, 'COGUANOR', '{"zonificacion": "3", "coeficiente_suelo": "0.5"}', 'Edificaciones de interés público', true);

-- Alta Verapaz (GT-06) - Normativa ambiental
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-06', 'ambiental', 'DMA-2019', 'Normativa Ambiental Departamental', 'Regulaciones ambientales específicas para Alta Verapaz', 2019, 'DMA', '{"proteccion_bosque": "obligatorio", "evaluacion_impacto": "requerida"}', 'Proyectos en áreas protegidas', true);

-- Escuintla (GT-07) - Normativa sanitaria
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-07', 'sanitaria', 'RGL-2018', 'Reglamento de Agua Potable', 'Normas para sistemas de agua potable y saneamiento', 2018, 'Municipal', '{"presion_minima": "20 psi", "calidad_agua": "OMS"}', 'Sistemas hidráulicos residenciales', true),
('GT-07', 'estructural', 'AGIES-41', 'Norma de Diseño Estructural', 'Normativa para diseño estructural con adaptaciones locales', 2021, 'AGIES', '{"carga_viva": "2.0 kPa", "zona_sismica": "2"}', 'Construcciones en zonas volcánicas', true);

-- Huehuetenango (GT-08) - Normativa sismica especial
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-08', 'sismica', 'COGUANOR-741-S', 'Norma Sísmica Especial', 'Adaptaciones por cercanía a fallas sísmicas principales', 2019, 'COGUANOR', '{"zonificacion": "4", "coeficiente_suelo": "0.7", "aumentaciones_estructurales": "20%"}', 'Todas las edificaciones', true);

-- Quiché (GT-10) - Normativa rural
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-10', 'estructural', 'AGIES-41-R', 'Norma Estructural Rural Simplificada', 'Requisitos simplificados para construcción rural', 2020, 'AGIES', '{"altura_max": "7m", "un_piso": "true", "material": "mamposteria"}', 'Viviendas unifamiliares rurales', true);

-- Quetzaltenango (GT-11) - Normativa urbanística e histórica
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-11', 'urbanistica', 'NU-2018', 'Normativa de Centro Histórico', 'Regulaciones especiales para centro histórico de Xela', 2018, 'Municipal', '{"fachada_tradicional": "protegida", "altura_max": "12m", "material_fachada": "restricciones"}', 'Propiedades en zona 1 centro histórico', true),
('GT-11', 'estructural', 'COGUANOR-537', 'Norma para Construcción con Adobe', 'Requisitos para construcción con adobe y materiales tradicionales', 2017, 'COGUANOR', '{"materiales": ["adobe", "madera", "teja"], "espesor_muros": "40cm"}', 'Viviendas tradicionales', true);

-- Sololá (GT-12) - Normativa agrícola
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-12', 'estructural', 'AGIES-41-A', 'Norma para Estructuras Agrícolas', 'Requisitos específicos para invernaderos y granjas', 2021, 'AGIES', '{"carga_viva": "1.5 kPa", "factor_ambiental": "1.2"}', 'Invernaderos y estructuras agrícolas', true);

-- Suchitepéquez (GT-15) - Normativa sísmica alta
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-15', 'sismica', 'COGUANOR-741-A', 'Norma Sísmica Zona Alta', 'Requisitos sísmicos especiales para zona de alta sismicidad', 2020, 'COGUANOR', '{"zonificacion": "5", "coeficiente_suelo": "0.8", "aumentaciones_estructurales": "30%"}', 'Edificaciones de más de 2 pisos', true);

-- Chiquimula (GT-16) - Normativa fronteriza
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-16', 'urbanistica', 'NU-2021', 'Normativa de Frontera', 'Regulaciones especiales por cercanía a frontera', 2021, 'Municipal', '{"seguridad_perimetro": "aumentado", "acceso_controlado": "true"}', 'Propiedades cercanas a frontera', true);

-- Santa Rosa (GT-17) - Normativa costera
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-17', 'ambiental', 'DMA-2020', 'Normativa Costera', 'Regulaciones ambientales para zona costera', 2020, 'DMA', '{"proteccion_manglar": "obligatorio", "distancia_mareas": "100m"}', 'Desarrollos en zona costera', true),
('GT-17', 'estructural', 'AGIES-41-C', 'Norma para Ambientes Salinos', 'Requisitos para construcción en ambientes salinos', 2021, 'AGIES', '{"concreto_resistente_cloruros": "requerido", "acero_galvanizado": "obligatorio"}', 'Estructuras en zona costera', true);

-- Izabal (GT-18) - Normativa fluvial
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-18', 'estructural', 'AGIES-41-F', 'Norma para Ambientes Fluviales', 'Requisitos para áreas propensas a inundación', 2021, 'AGIES', '{"altura_piso_min": "3m", "alcance_proteccion": "2m", "drenaje": "obligatorio"}', 'Construcciones en zonas bajas', true);

-- Zacapa (GT-19) - Normativa climática
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-19', 'ambiental', 'DMA-2022', 'Normativa Climática Especial', 'Regulaciones por clima extremo seco-caluroso', 2022, 'DMA', '{"proteccion_solar": "obligatorio", "ventilacion_natural": "requerida"}', 'Construcciones en zona extrema', true),
('GT-19', 'estructural', 'AGIES-41-T', 'Norma para Variación Térmica', 'Consideraciones por variación térmica extrema', 2022, 'AGIES', '{"juntas_expansion": "especificadas", "proteccion_aislamiento": "requerido"}', 'Estructuras de larga longitud', true);

-- Chimaltenango (GT-20) - Normativa metropolitana
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-20', 'urbanistica', 'NU-2022', 'Normativa Metropolitana', 'Regulaciones para área metropolitana de capital', 2022, 'Municipal', '{"densidad_maxima": "300 hab/ha", "uso_mixto": "permitido", "altura_max": "25m"}', 'Desarrollos en área metropolitana', true),
('GT-20', 'electrica', 'IEEE-2019', 'Normativa Eléctrica Departamental', 'Requisitos eléctricos adaptados a infraestructura local', 2019, 'EMPRESA', '{"voltaje_estandar": "120V", "tension_max": "240V"}', 'Instalaciones eléctricas residenciales', true);

-- Progreso (GT-22) - Normativa agrícola intensiva
INSERT INTO erp_normativa_departamental (departamento_codigo, tipo_norma, codigo_norma, nombre_norma, descripcion, ano_ultima_revision, organismo_emisor, requisitos_especificos, aplicacion, activo) VALUES
('GT-22', 'estructural', 'AGIES-41-G', 'Norma para Agricultura Intensiva', 'Requisitos para invernaderos de alta tecnología', 2021, 'AGIES', '{"carga_viva": "2.0 kPa", "automatizacion": "permitida", "altura_max": "12m"}', 'Invernaderos y granjas tecnificadas', true);

-- ============================================================
-- 4. FUNCIÓN PARA OBTENER NORMATIVA POR DEPARTAMENTO
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_normativa_departamental(
  p_departamento_codigo text,
  p_tipo_norma text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  tipo_norma text,
  codigo_norma text,
  nombre_norma text,
  descripcion text,
  ano_ultima_revision integer,
  organismo_emisor text,
  requisitos_especificos jsonb,
  aplicacion text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    tipo_norma,
    codigo_norma,
    nombre_norma,
    descripcion,
    ano_ultima_revision,
    organismo_emisor,
    requisitos_especificos,
    aplicacion
  FROM erp_normativa_departamental
  WHERE departamento_codigo = p_departamento_codigo
    AND (p_tipo_norma IS NULL OR tipo_norma = p_tipo_norma)
    AND activo = true
  ORDER BY tipo_norma, codigo_norma;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. FUNCIÓN PARA VALIDAR CUMPLIMIENTO NORMATIVO
-- ============================================================

CREATE OR REPLACE FUNCTION validar_cumplimiento_normativo(
  p_departamento_codigo text,
  p_tipo_norma text,
  p_parametros_calculo jsonb
)
RETURNS TABLE(
  cumple_norma boolean,
  normativa_aplicable text,
  observaciones text[],
  requisitos_faltantes text[]
) AS $$
DECLARE
  v_normativas RECORD;
  v_observaciones text[] := '{}';
  v_requisitos_faltantes text[] := '{}';
  v_cumple boolean := true;
BEGIN
  -- Obtener normativa aplicable
  FOR v_normativas IN
    SELECT * FROM erp_normativa_departamental
    WHERE departamento_codigo = p_departamento_codigo
      AND (p_tipo_norma IS NULL OR tipo_norma = p_tipo_norma)
      AND activo = true
  LOOP
    -- Validar requisitos específicos (ejemplo básico)
    IF p_parametros_calculo ? 'carga_viva' THEN
      IF (v_normativas.requisitos_especifices->>'carga_viva')::numeric < (p_parametros_calculo->>'carga_viva')::numeric THEN
        v_cumple := false;
        v_observaciones := array_append(v_observaciones, 'Carga viva excede normativa: ' || v_normativas.nombre_norma);
        v_requisitos_faltantes := array_append(v_requisitos_faltantes, 'Cargar según normativa ' || v_normativas.codigo_norma);
      END IF;
    END IF;
    
    IF p_parametros_calculo ? 'altura' THEN
      IF (v_normativas.requisitos_especificos->>'altura_max')::numeric < (p_parametros_calculo->>'altura')::numeric THEN
        v_cumple := false;
        v_observaciones := array_append(v_observaciones, 'Altura excede normativa: ' || v_normativas.nombre_norma);
        v_requisitos_faltantes := array_append(v_requisitos_faltantes, 'Reducir altura según ' || v_normativas.codigo_norma);
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY
  SELECT
    v_cumple as cumple_norma,
    COALESCE(MAX(nombre_norma), 'Sin normativa aplicable') as normativa_aplicable,
    v_observaciones as observaciones,
    v_requisitos_faltantes as requisitos_faltantes
  FROM erp_normativa_departamental
  WHERE departamento_codigo = p_departamento_codigo
    AND (p_tipo_norma IS NULL OR tipo_norma = p_tipo_norma)
    AND activo = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. TRIGGER DE ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_normativa()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_normativa ON erp_normativa_departamental;
CREATE TRIGGER trigger_actualizar_normativa
BEFORE UPDATE ON erp_normativa_departamental
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_normativa();

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

SELECT 'Tabla normativa_departamental' as componente, COUNT(*) as total FROM erp_normativa_departamental
UNION ALL
SELECT 'Función obtener_normativa_departamental', 1 FROM pg_proc WHERE proname = 'obtener_normativa_departamental'
UNION ALL
SELECT 'Función validar_cumplimiento_normativo', 1 FROM pg_proc WHERE proname = 'validar_cumplimiento_normativo';