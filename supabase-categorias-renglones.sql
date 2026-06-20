-- ============================================================
-- TABLA DE CATEGORÍAS DE RENGLONES POR TIPOLOGÍA
-- Ejecutar en SQL Editor de Supabase: https://app.supabase.com
-- Proyecto: neygzluxugodiwcuctbj.supabase.co
-- ============================================================

-- Crear tabla de categorías de renglones
CREATE TABLE IF NOT EXISTS erp_categorias_renglones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  categoria text NOT NULL,
  tipologia text NOT NULL CHECK (tipologia IN ('residencial', 'comercial', 'industrial', 'civil', 'publica')),
  subcategoria text,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categorias_tipologia ON erp_categorias_renglones(tipologia);
CREATE INDEX IF NOT EXISTS idx_categorias_activas ON erp_categorias_renglones(activo);

-- ============================================================
-- CATEGORÍAS PARA TIPOLOGÍA RESIDENCIAL
-- ============================================================

INSERT INTO erp_categorias_renglones (categoria, tipologia, subcategoria, descripcion) VALUES
('Cimentación', 'residencial', 'Cimientos corridos', 'Cimientos de concreto para viviendas'),
('Cimentación', 'residencial', 'Cimientos aislados', 'Cimientos individuales para columnas'),
('Cimentación', 'residencial', 'Losas de cimentación', 'Losas de cimentación armadas'),
('Cimentación', 'residencial', 'Impermeabilización', 'Impermeabilización de cimientos'),
('Estructura', 'residencial', 'Columnas y vigas', 'Estructuras de concreto armado'),
('Estructura', 'residencial', 'Losas entrepiso', 'Losas de entrepiso'),
('Estructura', 'residencial', 'Muros de carga', 'Muros portantes de concreto'),
('Estructura', 'residencial', 'Escaleras', 'Escaleras de concreto'),
('Mampostería', 'residencial', 'Muros de bloque', 'Muros de bloque de concreto'),
('Mampostería', 'residencial', 'Muros de ladrillo', 'Muros de ladrillo'),
('Mampostería', 'residencial', 'Divisiones', 'Divisiones interiores'),
('Mampostería', 'residencial', 'Aplanados', 'Aplanados en muros'),
('Acabados', 'residencial', 'Pisos', 'Cerámica, porcelanato, mármol'),
('Acabados', 'residencial', 'Paredes', 'Pintura, estuco, papel tapiz'),
('Acabados', 'residencial', 'Plafones', 'Yeso, PVC, fibrocemento'),
('Acabados', 'residencial', 'Carpintería', 'Carpintería interiores'),
('Acabados', 'residencial', 'Herrería', 'Herrería interior'),
('Acabados', 'residencial', 'Vidriería', 'Ventanas y puertas de vidrio'),
('Acabados', 'residencial', 'Baños', 'Sanitarios, grifería, accesorios'),
('Acabados', 'residencial', 'Cocinas', 'Muebles, encimeras, artefactos'),
('Instalaciones', 'residencial', 'Eléctrica', 'Instalación eléctrica residencial'),
('Instalaciones', 'residencial', 'Hidráulica', 'Tuberías, grifos, sanitarios'),
('Instalaciones', 'residencial', 'Sanitaria', 'Desagües, ventilación'),
('Instalaciones', 'residencial', 'Gas', 'Instalación de gas'),
('Instalaciones', 'residencial', 'Aire acondicionado', 'Sistemas de HVAC'),
('Exteriores', 'residencial', 'Fachadas', 'Acabados de fachada'),
('Exteriores', 'residencial', 'Techos', 'Techos de teja o lámina'),
('Exteriores', 'residencial', 'Jardines', 'Áreas verdes exteriores'),
('Exteriores', 'residencial', 'Cercas', 'Cercas y portones');

-- ============================================================
-- CATEGORÍAS PARA TIPOLOGÍA COMERCIAL
-- ============================================================

INSERT INTO erp_categorias_renglones (categoria, tipologia, subcategoria, descripcion) VALUES
('Cimentación', 'comercial', 'Cimientos reforzados', 'Cimientos de alta capacidad'),
('Cimentación', 'comercial', 'Losas pesadas', 'Losas para grandes cargas'),
('Cimentación', 'comercial', 'Pilotes', 'Pilotes y pilas'),
('Cimentación', 'comercial', 'Drenaje', 'Drenaje de cimientos'),
('Estructura', 'comercial', 'Concreto armado', 'Estructuras de concreto armado'),
('Estructura', 'comercial', 'Metálica', 'Estructuras metálicas'),
('Estructura', 'comercial', 'Losas', 'Losas de gran carga'),
('Estructura', 'comercial', 'Naves', 'Naves industriales'),
('Estructura', 'comercial', 'Ascensores', 'Elevadores y escaleras mecánicas'),
('Acabados', 'comercial', 'Pisos comerciales', 'Porcelanato, mármol, epóxico'),
('Acabados', 'comercial', 'Paredes', 'Pintura, madera, vidrio'),
('Acabados', 'comercial', 'Plafones', 'Suspendidos acústicos y metálicos'),
('Acabados', 'comercial', 'Carpintería', 'Vitrinas, oficinas'),
('Acabados', 'comercial', 'Vidriería', 'Vidrio templado'),
('Instalaciones', 'comercial', 'Eléctrica alta potencia', 'Sistemas eléctricos comerciales'),
('Instalaciones', 'comercial', 'Iluminación', 'LED, track lighting'),
('Instalaciones', 'comercial', 'HVAC', 'Sistemas centralizados'),
('Instalaciones', 'comercial', 'Contra incendios', 'Sprinklers, detectores'),
('Instalaciones', 'comercial', 'Seguridad', 'CCTV, control acceso'),
('Instalaciones', 'comercial', 'Comunicaciones', 'Datos, telefonía'),
('Equipamiento', 'comercial', 'Montacargas', 'Montacargas comerciales'),
('Equipamiento', 'comercial', 'Puertas', 'Puertas automáticas'),
('Exteriores', 'comercial', 'Fachadas', 'Vidrio, ACM, piedra'),
('Exteriores', 'comercial', 'Cubiertas', 'Cubiertas metálicas'),
('Exteriores', 'comercial', 'Estacionamientos', 'Áreas de estacionamiento'),
('Exteriores', 'comercial', 'Señalización', 'Señalización comercial');

-- ============================================================
-- CATEGORÍAS PARA TIPOLOGÍA INDUSTRIAL
-- ============================================================

INSERT INTO erp_categorias_renglones (categoria, tipologia, subcategoria, descripcion) VALUES
('Cimentación', 'industrial', 'Pesada', 'Cimientos para maquinaria pesada'),
('Cimentación', 'industrial', 'Grandes losas', 'Losas de gran capacidad'),
('Cimentación', 'industrial', 'Pilotes', 'Pilotes y cajones'),
('Cimentación', 'industrial', 'Suelos reforzados', 'Suelos reforzados para cargas'),
('Estructura', 'industrial', 'Metálica pesada', 'Estructuras metálicas pesadas'),
('Estructura', 'industrial', 'Naves', 'Naves industriales'),
('Estructura', 'industrial', 'Alta resistencia', 'Concreto de alta resistencia'),
('Estructura', 'industrial', 'Pisos técnicos', 'Plataformas y pisos técnicos'),
('Instalaciones', 'industrial', 'Alta tensión', 'Electricidad de alta tensión'),
('Instalaciones', 'industrial', 'Subestaciones', 'Subestaciones eléctricas'),
('Instalaciones', 'industrial', 'Aire comprimido', 'Sistemas de aire comprimido'),
('Instalaciones', 'industrial', 'Fluidos', 'Sistemas de fluidos industriales'),
('Instalaciones', 'industrial', 'Ventilación', 'Sistemas de ventilación'),
('Equipamiento', 'industrial', 'Montacargas', 'Montacargas industriales'),
('Equipamiento', 'industrial', 'Grúas', 'Grúas puente'),
('Equipamiento', 'industrial', 'Transportadoras', 'Cintas transportadoras'),
('Equipamiento', 'industrial', 'Tanques', 'Tanques y silos'),
('Pisos', 'industrial', 'Concreto reforzado', 'Pisos de concreto reforzado'),
('Pisos', 'industrial', 'Epóxico', 'Pisos epóxicos'),
('Pisos', 'industrial', 'Antideslizante', 'Pisos antideslizantes'),
('Pisos', 'industrial', 'Químico', 'Resistencia química'),
('Aislamiento', 'industrial', 'Térmico', 'Aislamiento térmico'),
('Aislamiento', 'industrial', 'Acústico', 'Aislamiento acústico'),
('Aislamiento', 'industrial', 'Químico', 'Recubrimientos químicos'),
('Seguridad', 'industrial', 'Contra incendios', 'Sistemas contra incendios'),
('Seguridad', 'industrial', 'Drenaje', 'Drenaje de emergencia'),
('Seguridad', 'industrial', 'Evacuación', 'Vías de escape'),
('Seguridad', 'industrial', 'Contención', 'Sistemas de contención');

-- ============================================================
-- CATEGORÍAS PARA TIPOLOGÍA CIVIL
-- ============================================================

INSERT INTO erp_categorias_renglones (categoria, tipologia, subcategoria, descripcion) VALUES
('Movimiento_tierra', 'civil', 'Excavación', 'Excavación en general'),
('Movimiento_tierra', 'civil', 'Rellenos', 'Rellenos y compactación'),
('Movimiento_tierra', 'civil', 'Nivelación', 'Nivelación y terraplenes'),
('Movimiento_tierra', 'civil', 'Corte relleno', 'Corte y relleno'),
('Estructura', 'civil', 'Cimentación carretera', 'Cimientos para carreteras'),
('Estructura', 'civil', 'Estructuras puente', 'Estructuras de puentes'),
('Estructura', 'civil', 'Losas pavimento', 'Losas de pavimento'),
('Estructura', 'civil', 'Muros contención', 'Muros de contención'),
('Pavimentación', 'civil', 'Asfáltico', 'Pavimento asfáltico'),
('Pavimentación', 'civil', 'Concreto', 'Pavimento de concreto'),
('Pavimentación', 'civil', 'Base', 'Base y subbase'),
('Pavimentación', 'civil', 'Señalización', 'Señalización vial'),
('Hidráulica', 'civil', 'Canales', 'Canales y canaletas'),
('Hidráulica', 'civil', 'Acueductos', 'Acueductos y alcantarillas'),
('Hidráulica', 'civil', 'Estructuras', 'Estructuras hidráulicas'),
('Hidráulica', 'civil', 'Diques', 'Diques y represas'),
('Drenaje', 'civil', 'Superficial', 'Drenaje superficial'),
('Drenaje', 'civil', 'Profundo', 'Drenaje profundo'),
('Drenaje', 'civil', 'Cámaras', 'Cámaras de visita'),
('Drenaje', 'civil', 'Bombeo', 'Sistemas de bombeo'),
('Obras_arte', 'civil', 'Puentes', 'Puentes vehiculares'),
('Obras_arte', 'civil', 'Peatonales', 'Puentes peatonales'),
('Obras_arte', 'civil', 'Viaductos', 'Viaductos'),
('Obras_arte', 'civil', 'Túneles', 'Túneles'),
('Geosintéticos', 'civil', 'Geomallas', 'Geomallas y geotextiles'),
('Geosintéticos', 'civil', 'Muros reforzados', 'Muros reforzados'),
('Geosintéticos', 'civil', 'Taludes', 'Estabilización de taludes');

-- ============================================================
-- CATEGORÍAS PARA TIPOLOGÍA PÚBLICA
-- ============================================================

-- Educativa
INSERT INTO erp_categorias_renglones (categoria, tipologia, subcategoria, descripcion) VALUES
('Aulas', 'publica', 'Pisos resistencia', 'Pisos de alta resistencia'),
('Aulas', 'publica', 'Pizarras', 'Pizarras y smartboards'),
('Aulas', 'publica', 'Iluminación', 'Iluminación especial'),
('Aulas', 'publica', 'Acústica', 'Acústica controlada'),
('Areas_comunes', 'publica', 'Auditorios', 'Auditorios y salas'),
('Areas_comunes', 'publica', 'Bibliotecas', 'Bibliotecas'),
('Areas_comunes', 'publica', 'Cafeterías', 'Áreas de comida'),
('Areas_comunes', 'publica', 'Administrativas', 'Áreas administrativas'),
('Salud', 'publica', 'Habitaciones', 'Habitaciones hospitalarias'),
('Salud', 'publica', 'Quirófanos', 'Quirófanos'),
('Salud', 'publica', 'Urgencias', 'Salas de urgencias'),
('Salud', 'publica', 'Laboratorios', 'Laboratorios clínicos'),
('Equipamiento_medico', 'publica', 'Oxígeno', 'Sistemas de oxígeno médico'),
('Equipamiento_medico', 'publica', 'Gases', 'Gases médicos especiales'),
('Equipamiento_medico', 'publica', 'Vacío', 'Sistemas de vacío'),
('Equipamiento_medico', 'publica', 'Agua purificada', 'Sistemas de agua purificada'),
('Infraestructura_salud', 'publica', 'Ascensores', 'Ascensores de camillas'),
('Infraestructura_salud', 'publica', 'Aislamiento', 'Sistemas de aislamiento'),
('Infraestructura_salud', 'publica', 'Cuartos', 'Cuartos limpios/sucios'),
('Oficinas', 'publica', 'Atención', 'Áreas de atención al público'),
('Oficinas', 'publica', 'Administrativas', 'Oficinas administrativas'),
('Oficinas', 'publica', 'Juntas', 'Salas de juntas'),
('Oficinas', 'publica', 'Archivos', 'Archivos'),
('Servicio_municipal', 'publica', 'Bodegas', 'Bodegas municipales'),
('Servicio_municipal', 'publica', 'Talleres', 'Talleres de mantenimiento'),
('Servicio_municipal', 'publica', 'Estacionamientos', 'Estacionamientos'),
('Servicio_municipal', 'publica', 'Carga', 'Áreas de carga'),
('Deportivas', 'publica', 'Canchas', 'Canchas deportivas'),
('Deportivas', 'publica', 'Piscinas', 'Piscinas'),
('Deportivas', 'publica', 'Pistas', 'Pistas de atletismo'),
('Deportivas', 'publica', 'Gimnasios', 'Gimnasios'),
('Infraestructura_deportiva', 'publica', 'Vestidores', 'Vestidores y baños'),
('Infraestructura_deportiva', 'publica', 'Graderías', 'Graderías'),
('Infraestructura_deportiva', 'publica', 'Iluminación', 'Iluminación deportiva'),
('Infraestructura_deportiva', 'publica', 'Sonido', 'Sistemas de sonido');

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Verificar categorías por tipología
SELECT tipologia, categoria, COUNT(*) as total 
FROM erp_categorias_renglones 
GROUP BY tipologia, categoria 
ORDER BY tipologia, categoria;

-- Verificar total general
SELECT tipologia, COUNT(*) as total 
FROM erp_categorias_renglones 
GROUP BY tipologia 
ORDER BY tipologia;

-- RESULTADO ESPERADO:
-- - Residencial: ~25 categorías
-- - Comercial: ~26 categorías
-- - Industrial: ~25 categorías
-- - Civil: ~24 categorías
-- - Pública: ~28 categorías
-- - TOTAL: ~128 categorías