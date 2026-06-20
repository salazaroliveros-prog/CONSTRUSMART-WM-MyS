-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 1: SUBTIPOLOGÍAS
-- 25 subtipologías detalladas (5 por tipología principal)
-- Versión: 2026-06-13
-- ============================================================

-- ============================================================
-- 1. TABLA DE SUBTIPOLOGÍAS
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_subtipologias (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tipologia text NOT NULL CHECK (tipologia IN ('residencial','comercial','industrial','civil','publica')),
  subtipo text NOT NULL,
  descripcion text NOT NULL,
  factor_costo numeric(4,3) NOT NULL,
  factor_rendimiento numeric(4,3) NOT NULL,
  caracteristicas text[],
  normas_especiales text[],
  requisitos_especiales text[],
  activo boolean DEFAULT true,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX idx_subtipologias_combo ON erp_subtipologias(tipologia, subtipo);
CREATE INDEX idx_subtipologias_activas ON erp_subtipologias(activo);

-- ============================================================
-- 2. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_subtipologias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subtipologias_read_all" ON erp_subtipologias FOR SELECT TO authenticated USING (activo = true);

-- ============================================================
-- 3. INSERTAR 25 SUBTIPOLOGÍAS
-- ============================================================

-- RESIDENCIAL
INSERT INTO erp_subtipologias (tipologia, subtipo, descripcion, factor_costo, factor_rendimiento, caracteristicas, normas_especiales, requisitos_especiales, observaciones) VALUES
('residencial', 'casa_individual', 'Vivienda unifamiliar aislada', 1.10, 0.95, ARRAY['Acabados personalizados', 'Jardín privado', 'Garaje individual'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01'], ARRAY['Drenaje perimetral', 'Cisterna 2000L', 'Cercado perimetral'], 'Vivienda personalizada con lotes individuales'),
('residencial', 'condominio_horizontal', 'Conjunto de viviendas en lotes adyacentes', 0.90, 1.05, ARRAY['Economías de escala', 'Áreas comunes', 'Infraestructura compartida'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01', 'Código de condominio GT'], ARRAY['Muro perimetral', 'Caseta de vigilancia', 'Red de aguas lluvias'], 'Conjunto residencial horizontal'),
('residencial', 'condominio_vertical', 'Edificio de apartamentos', 0.95, 1.10, ARRAY['Escaleras verticales', 'Economías de escala', 'MEP centralizado'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01', 'Código de condominio GT', 'NFPA 101'], ARRAY['Elevador', 'Sistema contra incendios', 'Cisterna 5000L', 'Planta de tratamiento'], 'Edificio de apartamentos en altura'),
('residencial', 'residencial_lujo', 'Vivienda de alta gama con acabados premium', 1.35, 0.85, ARRAY['Acabados importados', 'Sistemas domóticos', 'Piscina', 'Jacuzzi'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01', 'Normas de lujo internacionales'], ARRAY['Sistema de riego automático', 'Generador de emergencia', 'Sistema de seguridad'], 'Vivienda de lujo con acabados premium'),
('residencial', 'vivienda_social', 'Vivienda económica estandarizada', 0.75, 1.20, ARRAY['Estandarización máxima', 'Acabados básicos', 'Materiales locales'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01', 'Normas subsidio vivienda'], ARRAY['Plumbing básico', 'Sin acabados finos', 'Áreas mínimas'], 'Vivienda económica estandarizada'),

-- COMERCIAL
('comercial', 'local_comercial', 'Local comercial individual', 1.0, 0.95, ARRAY['Instalaciones comerciales básicas', 'Fachada vidrio', 'Sanitario público'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01', 'Código comercial GT'], ARRAY['Carga viva 500 kg/m²', 'Extractora de humo', 'Acceso de carga'], 'Local comercial individual'),
('comercial', 'centro_comercial', 'Gran centro comercial con múltiples locales', 1.30, 0.90, ARRAY['MEP complejo', 'Escaleras mecánicas', 'Carga viva alta', 'Parking subterráneo'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01', 'NFPA 101', 'NFPA 13'], ARRAY['Sistema HVAC central', 'Sistema contra incendios completo', 'Cisterna 10000L', 'Generador principal'], 'Centro comercial grande'),
('comercial', 'oficinas', 'Edificio de oficinas corporativas', 1.25, 0.90, ARRAY['Acabados corporativos', 'Sistema HVAC', 'Falso cielo', 'Cubiertas metálicas'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01', 'ASHRAE 90.1'], ARRAY['Elevadores', 'Sistema HVAC VRF', 'Cisterna 8000L', 'Planta de tratamiento'], 'Edificio de oficinas corporativas'),
('comercial', 'hotel', 'Hotel con habitaciones y servicios', 1.40, 0.85, ARRAY['Acabados hoteleros', 'Plomería intensiva', 'Sistema HVAC', 'Restaurantes'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01', 'NFPA 101', 'ASHRAE 55'], ARRAY['Sistema HVAC completo', 'Cisterna 15000L', 'Planta de tratamiento', 'Sistema contra incendios'], 'Hotel con habitaciones y servicios'),
('comercial', 'retail_rapido', 'Tienda de retail rápido (fast food, farmacia)', 0.95, 1.05, ARRAY['Estandarización', 'Tiempos cortos', 'Concepto repetitivo'], ARRAY['COGUANOR NGO 41009', 'AGIES 42.01', 'Normas de franquicia'], ARRAY['Extractora de humo', 'Sanitario público', 'Acceso de carga rápido'], 'Tienda de retail rápido'),

-- INDUSTRIAL
('industrial', 'bodega_logistica', 'Bodega para almacenamiento y distribución', 1.15, 0.95, ARRAY['Claros grandes', 'Estructura metálica', 'Pisos reforzados', 'Docks de carga'], ARRAY['COGUANOR NGO 41009', 'AGIES 41.02', 'NFPA 13'], ARRAY['Carga viva 1000 kg/m²', 'Sistema sprinklers', 'Docks niveladores', 'Iluminación industrial'], 'Bodega logística'),
('industrial', 'planta_manufactura', 'Planta de manufactura con maquinaria pesada', 1.50, 0.80, ARRAY['Cimentaciones especiales', 'Maquinaria pesada', 'Servicios industriales', 'Laboratorios'], ARRAY['COGUANOR NGO 41009', 'AGIES 41.02', 'NFPA 33', 'OSHA'], ARRAY['Cimentaciones reforzadas', 'Sistema ventilación industrial', 'Subestación eléctrica', 'Planta de tratamiento'], 'Planta de manufactura'),
('industrial', 'nave_metalica', 'Nave industrial metálica prefabricada', 1.0, 1.10, ARRAY['Estructura prefabricada', 'Montaje rápido', 'Claros 20-40m', 'Economías de escala'], ARRAY['COGUANOR NGO 41009', 'AGIES 41.02', 'AISC'], ARRAY['Anclajes sísmicos', 'Carga viva 750 kg/m²', 'Ventilación natural', 'Drenaje industrial'], 'Nave industrial metálica prefabricada'),
('industrial', 'farmaceutica', 'Planta farmacéutica con salas limpias', 1.80, 0.70, ARRAY['Salas limpias GMP', 'HVAC de precisión', 'Sistemas de validación', 'Laboratorios QC'], ARRAY['COGUANOR NGO 41009', 'GMP', 'FDA 21 CFR', 'ISO 14644'], ARRAY['HVAC de precisión', 'Filtración HEPA', 'Sistema de validación', 'Cuartos fríos'], 'Planta farmacéutica'),
('industrial', 'data_center', 'Centro de datos con redundancias', 2.0, 0.65, ARRAY['Redundancia N+1', 'HVAC de precisión', 'Seguridad física', 'Sistemas UPS'], ARRAY['COGUANOR NGO 41009', 'TIA-942', 'Uptime Institute'], ARRAY['UPS redundante', 'Generador principal', 'HVAC de precisión N+1', 'Sistema detección incendios'], 'Centro de datos'),

-- CIVIL
('civil', 'puente', 'Puente vehicular o peatonal', 1.40, 0.85, ARRAY['Estructuras complejas', 'Geotecnia crítica', 'Cargas vivas variables', 'Fundaciones profundas'], ARRAY['AASHTO LRFD', 'AGIES 41.02', 'AASHTO HS20'], ARRAY['Estudios geotécnicos', 'Análisis hidráulico', 'Protección antisísmica', 'Drenaje estructural'], 'Puente vehicular o peatonal'),
('civil', 'carretera', 'Carretera o vía pavimentada', 1.15, 0.90, ARRAY['Pavimentos asfálticos', 'Drenajes laterales', 'Señalización', 'Obras de arte'], ARRAY['AASHTO', 'AGIES 51.01', 'COGUANOR NGO 34001'], ARRAY['Estudios de tránsito', 'Diseño de pavimentos', 'Drenaje pluvial', 'Señalización vial'], 'Carretera o vía pavimentada'),
('civil', 'tunel', 'Tunel vehicular o de servicios', 1.80, 0.70, ARRAY['Excavación subterránea', 'Ventilación forzada', 'Iluminación artificial', 'Sistemas de seguridad'], ARRAY['AASHTO LRFD', 'NFPA 502', 'ITU-T'], ARRAY['Ventilación mecánica', 'Sistema incendios tunel', 'Iluminación emergencia', 'Sistema comunicación'], 'Tunel vehicular o de servicios'),
('civil', 'presa', 'Presa o obra hidráulica mayor', 1.50, 0.75, ARRAY['Estructuras masivas', 'Geotecnia compleja', 'Criterios hidrológicos', 'Instrumentación'], ARRAY['USACE', 'ICOLD', 'AGIES 61.01'], ARRAY['Estudios hidrológicos', 'Análisis estabilidad', 'Instrumentación monitoreo', 'Compuertas y válvulas'], 'Presa o obra hidráulica mayor'),
('civil', 'obra_hidraulica', 'Canal, acueducto, o planta de tratamiento', 1.35, 0.80, ARRAY['Estructuras hidráulicas', 'Procesos de tratamiento', 'Equipos especiales', 'Civil complejo'], ARRAY['AGIES 61.01', 'EPA', 'COGUANOR NGO 33001'], ARRAY['Diseño hidráulico', 'Equipos de bombeo', 'Tanques de almacenamiento', 'Laboratorios de análisis'], 'Canal, acueducto, o planta de tratamiento'),

-- PÚBLICA
('publica', 'escuela', 'Escuela o centro educativo', 1.15, 0.90, ARRAY['Normativas MINEDUC', 'Resistencia al uso intensivo', 'Aulas estandarizadas', 'Áreas recreativas'], ARRAY['COGUANOR NGO 41009', 'Normas MINEDUC', 'AGIES 42.01'], ARRAY['Carga viva 350 kg/m²', 'Salones estandarizados', 'Áreas recreativas', 'Accesibilidad universal'], 'Escuela o centro educativo'),
('publica', 'centro_salud', 'Centro de salud o clínica', 1.35, 0.85, ARRAY['Instalaciones médicas', 'Normativas MSPAS', 'Servicios especializados', 'Laboratorios'], ARRAY['COGUANOR NGO 41009', 'Normas MSPAS', 'NFPA 99'], ARRAY['Instalaciones médicas', 'Cisterna 5000L', 'Planta de tratamiento', 'Sistema contra incendios'], 'Centro de salud o clínica'),
('publica', 'edificio_gubernamental', 'Edificio gubernamental o municipal', 1.30, 0.85, ARRAY['Protocolos de seguridad', 'Redundancias', 'Accesibilidad', 'Estándares oficiales'], ARRAY['COGUANOR NGO 41009', 'Normas gobierno', 'NFPA 101'], ARRAY['Sistema seguridad', 'Generador de emergencia', 'Cisterna 8000L', 'Accesibilidad universal'], 'Edificio gubernamental o municipal'),
('publica', 'obra_municipal', 'Infraestructura urbana municipal', 1.10, 0.95, ARRAY['Infraestructura urbana', 'Servicios públicos', 'Drenajes pluviales', 'Espacios públicos'], ARRAY['COGUANOR NGO 41009', 'Normas municipales', 'AGIES 51.01'], ARRAY['Drenaje pluvial', 'Red eléctrica subterránea', 'Alumbrado público', 'Mobiliario urbano'], 'Infraestructura urbana municipal')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. TRIGGER PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_subtipologias()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_subtipologias
BEFORE UPDATE ON erp_subtipologias
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp_subtipologias();

-- ============================================================
-- 5. FUNCIÓN PARA OBTENER SUBTIPOLOGÍAS POR TIPOLOGÍA
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_subtipologias_por_tipologia(p_tipologia text)
RETURNS TABLE(
  subtipo text,
  descripcion text,
  factor_costo numeric,
  factor_rendimiento numeric,
  caracteristicas text[],
  requisitos_especiales text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    subtipo,
    descripcion,
    factor_costo,
    factor_rendimiento,
    caracteristicas,
    requisitos_especiales
  FROM erp_subtipologias
  WHERE tipologia = p_tipologia
    AND activo = true
  ORDER BY subtipo;
END;
$$ LANGUAGE plpgsql;
