-- ============================================================
-- SEED DATA COMPLETO PARA FACTORES GUATEMALA
-- Ejecutar en SQL Editor de Supabase: https://app.supabase.com
-- Proyecto: neygzluxugodiwcuctbj.supabase.co
-- ============================================================
-- Incluye:
-- 1. Factores de Zona para los 22 departamentos de Guatemala
-- 2. Factores de Tipología para 5 tipologías constructivas
-- 3. Categorías de renglones específicas para cada tipología
-- ============================================================

-- Limpiar seed data anterior
DELETE FROM erp_reglas_factores;

-- ============================================================
-- 1. FACTORES DE ZONA - 22 DEPARTAMENTOS DE GUATEMALA
-- ============================================================

-- Factor Zona Guatemala (Capital - Base)
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Guatemala', 'Factor base para zona metropolitana Guatemala', 'zona', 10, '{"departamento": "Guatemala", "altitud": 1500, "clima": "templado"}'::jsonb, 1.0, 'multiplicar', 'departamento', 'GT-01');

-- Factor Zona El Progreso
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona El Progreso', 'Factor para El Progreso - clima seco cálido', 'zona', 10, '{"departamento": "El Progreso", "altitud": 450, "clima": "calido_seco"}'::jsonb, 1.05, 'multiplicar', 'departamento', 'GT-02');

-- Factor Zona Sacatepéquez
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Sacatepéquez', 'Factor para Sacatepéquez - zona turística', 'zona', 10, '{"departamento": "Sacatepéquez", "altitud": 2000, "clima": "templado_frio"}'::jsonb, 1.03, 'multiplicar', 'departamento', 'GT-03');

-- Factor Zona Chimaltenango
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Chimaltenango', 'Factor para Chimaltenango - zona industrial', 'zona', 10, '{"departamento": "Chimaltenango", "altitud": 1800, "clima": "templado"}'::jsonb, 1.04, 'multiplicar', 'departamento', 'GT-04');

-- Factor Zona Sololá
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Sololá', 'Factor para Sololá - altitud alta (>2000msnm)', 'zona', 10, '{"departamento": "Sololá", "altitud": 2100, "clima": "frio"}'::jsonb, 1.10, 'multiplicar', 'departamento', 'GT-05');

-- Factor Zona Totonicapán
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Totonicapán', 'Factor para Totonicapán - altitud muy alta', 'zona', 10, '{"departamento": "Totonicapán", "altitud": 2400, "clima": "frio"}'::jsonb, 1.11, 'multiplicar', 'departamento', 'GT-06');

-- Factor Zona Quetzaltenango
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Quetzaltenango', 'Factor para Quetzaltenango - altitud alta', 'zona', 10, '{"departamento": "Quetzaltenango", "altitud": 2330, "clima": "frio"}'::jsonb, 1.12, 'multiplicar', 'departamento', 'GT-07');

-- Factor Zona Suchitepéquez
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Suchitepéquez', 'Factor para Suchitepéquez - zona agrícola costera', 'zona', 10, '{"departamento": "Suchitepéquez", "altitud": 350, "clima": "calido_humedo"}'::jsonb, 1.07, 'multiplicar', 'departamento', 'GT-08');

-- Factor Zona Retalhuleu
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Retalhuleu', 'Factor para Retalhuleu - zona costera sur', 'zona', 10, '{"departamento": "Retalhuleu", "altitud": 200, "clima": "calido_humedo"}'::jsonb, 1.06, 'multiplicar', 'departamento', 'GT-09');

-- Factor Zona San Marcos
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona San Marcos', 'Factor para San Marcos - altitud alta', 'zona', 10, '{"departamento": "San Marcos", "altitud": 2500, "clima": "frio"}'::jsonb, 1.11, 'multiplicar', 'departamento', 'GT-10');

-- Factor Zona Huehuetenango
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Huehuetenango', 'Factor para Huehuetenango - altitud muy alta', 'zona', 10, '{"departamento": "Huehuetenango", "altitud": 1900, "clima": "frio"}'::jsonb, 1.13, 'multiplicar', 'departamento', 'GT-11');

-- Factor Zona Quiché
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Quiché', 'Factor para Quiché - zona rural montañosa', 'zona', 10, '{"departamento": "Quiché", "altitud": 1700, "clima": "templado_frio"}'::jsonb, 1.08, 'multiplicar', 'departamento', 'GT-12');

-- Factor Zona Baja Verapaz
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Baja Verapaz', 'Factor para Baja Verapaz - zona tropical', 'zona', 10, '{"departamento": "Baja Verapaz", "altitud": 800, "clima": "calido"}'::jsonb, 1.07, 'multiplicar', 'departamento', 'GT-13');

-- Factor Zona Alta Verapaz
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Alta Verapaz', 'Factor para Alta Verapaz - zona montañosa', 'zona', 10, '{"departamento": "Alta Verapaz", "altitud": 1300, "clima": "templado_humedo"}'::jsonb, 1.09, 'multiplicar', 'departamento', 'GT-14');

-- Factor Zona Petén
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Petén', 'Factor para Petén - clima caluroso + logística', 'zona', 10, '{"departamento": "Petén", "altitud": 130, "clima": "calido_tropical", "logistica": "distante"}'::jsonb, 1.15, 'multiplicar', 'departamento', 'GT-15');

-- Factor Zona Izabal
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Izabal', 'Factor para Izabal - clima caluroso + humedad', 'zona', 10, '{"departamento": "Izabal", "altitud": 10, "clima": "calido_humedo", "corrosion": "alta"}'::jsonb, 1.14, 'multiplicar', 'departamento', 'GT-16');

-- Factor Zona Zacapa
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Zacapa', 'Factor para Zacapa - clima seco cálido', 'zona', 10, '{"departamento": "Zacapa", "altitud": 200, "clima": "calido_seco"}'::jsonb, 1.06, 'multiplicar', 'departamento', 'GT-17');

-- Factor Zona Chiquimula
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Chiquimula', 'Factor para Chiquimula - zona oriental', 'zona', 10, '{"departamento": "Chiquimula", "altitud": 800, "clima": "calido_seco"}'::jsonb, 1.07, 'multiplicar', 'departamento', 'GT-18');

-- Factor Zona Jalapa
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Jalapa', 'Factor para Jalapa - zona oriental templada', 'zona', 10, '{"departamento": "Jalapa", "altitud": 1400, "clima": "templado"}'::jsonb, 1.04, 'multiplicar', 'departamento', 'GT-19');

-- Factor Zona Jutiapa
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Jutiapa', 'Factor para Jutiapa - clima seco', 'zona', 10, '{"departamento": "Jutiapa", "altitud": 900, "clima": "calido_seco"}'::jsonb, 1.08, 'multiplicar', 'departamento', 'GT-20');

-- Factor Zona Santa Rosa
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, departamento_id)
VALUES 
  ('Factor Zona Santa Rosa', 'Factor para Santa Rosa - zona costera', 'zona', 10, '{"departamento": "Santa Rosa", "altitud": 300, "clima": "calido_humedo"}'::jsonb, 1.07, 'multiplicar', 'departamento', 'GT-21');

-- ============================================================
-- 2. FACTORES DE TIPOLOGÍA - 5 TIPOLOGÍAS CONSTRUCTIVAS
-- ============================================================

-- RESIDENCIAL (Factor base 1.0)
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, tipologia)
VALUES 
  ('Factor Tipología Residencial', 'Factor base para proyectos residenciales', 'tipologia', 20, '{"tipologia": "residencial", "complejidad": "estandar"}'::jsonb, 1.0, 'multiplicar', 'global', 'residencial'),
  ('Residencial - Alta Calidad', 'Factor para residenciales de alta gama', 'tipologia', 25, '{"tipologia": "residencial", "calidad": "alta", "acabados": "premium"}'::jsonb, 1.15, 'multiplicar', 'global', 'residencial'),
  ('Residencial - Económico', 'Factor para vivienda económica', 'tipologia', 25, '{"tipologia": "residencial", "calidad": "economica", "acabados": "basicos"}'::jsonb, 0.92, 'multiplicar', 'global', 'residencial');

-- COMERCIAL (Factor 1.15)
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, tipologia)
VALUES 
  ('Factor Tipología Comercial', 'Factor para proyectos comerciales', 'tipologia', 20, '{"tipologia": "comercial", "complejidad": "media"}'::jsonb, 1.15, 'multiplicar', 'global', 'comercial'),
  ('Comercial - Shopping Mall', 'Factor para centros comerciales complejos', 'tipologia', 30, '{"tipologia": "comercial", "subtipo": "shopping_mall", "equipamiento": "completo"}'::jsonb, 1.35, 'multiplicar', 'global', 'comercial'),
  ('Comercial - Oficinas', 'Factor para edificos de oficinas', 'tipologia', 25, '{"tipologia": "comercial", "subtipo": "oficinas", "equipamiento": "corporativo"}'::jsonb, 1.20, 'multiplicar', 'global', 'comercial'),
  ('Comercial - Retail', 'Factor para locales comerciales', 'tipologia', 25, '{"tipologia": "comercial", "subtipo": "retail", "equipamiento": "basico"}'::jsonb, 1.10, 'multiplicar', 'global', 'comercial');

-- INDUSTRIAL (Factor 1.35)
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, tipologia)
VALUES 
  ('Factor Tipología Industrial', 'Factor para proyectos industriales', 'tipologia', 20, '{"tipologia": "industrial", "complejidad": "alta"}'::jsonb, 1.35, 'multiplicar', 'global', 'industrial'),
  ('Industrial - Manufactura', 'Factor para plantas de manufactura', 'tipologia', 30, '{"tipologia": "industrial", "subtipo": "manufactura", "equipamiento": "especializado"}'::jsonb, 1.40, 'multiplicar', 'global', 'industrial'),
  ('Industrial - Almacén', 'Factor para almacenes y bodegas', 'tipologia', 25, '{"tipologia": "industrial", "subtipo": "almacen", "equipamiento": "logistica"}'::jsonb, 1.25, 'multiplicar', 'global', 'industrial'),
  ('Industrial - Procesos', 'Factor para plantas de procesos', 'tipologia', 30, '{"tipologia": "industrial", "subtipo": "procesos", "equipamiento": "quimico"}'::jsonb, 1.45, 'multiplicar', 'global', 'industrial');

-- CIVIL (Factor 1.20)
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, tipologia)
VALUES 
  ('Factor Tipología Civil', 'Factor para obras civiles', 'tipologia', 20, '{"tipologia": "civil", "complejidad": "media_alta"}'::jsonb, 1.20, 'multiplicar', 'global', 'civil'),
  ('Civil - Carreteras', 'Factor para carreteras y vías', 'tipologia', 30, '{"tipologia": "civil", "subtipo": "carreteras", "movimiento_tierra": "intenso"}'::jsonb, 1.25, 'multiplicar', 'global', 'civil'),
  ('Civil - Puentes', 'Factor para puentes y viaductos', 'tipologia', 35, '{"tipologia": "civil", "subtipo": "puentes", "ingenieria": "compleja"}'::jsonb, 1.35, 'multiplicar', 'global', 'civil'),
  ('Civil - Drenaje', 'Factor para sistemas de drenaje', 'tipologia', 25, '{"tipologia": "civil", "subtipo": "drenaje", "infraestructura": "hidraulica"}'::jsonb, 1.15, 'multiplicar', 'global', 'civil'),
  ('Civil - Agua Potable', 'Factor para acueductos y plantas', 'tipologia', 25, '{"tipologia": "civil", "subtipo": "agua_potable", "infraestructura": "sanitaria"}'::jsonb, 1.18, 'multiplicar', 'global', 'civil');

-- PÚBLICA (Factor 1.18)
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito, tipologia)
VALUES 
  ('Factor Tipología Pública', 'Factor para proyectos públicos', 'tipologia', 20, '{"tipologia": "publica", "complejidad": "media"}'::jsonb, 1.18, 'multiplicar', 'global', 'publica'),
  ('Pública - Educativa', 'Factor para edificios educativos', 'tipologia', 25, '{"tipologia": "publica", "subtipo": "educativa", "normas": "mineduc"}'::jsonb, 1.15, 'multiplicar', 'global', 'publica'),
  ('Pública - Salud', 'Factor para hospitales y clínicas', 'tipologia', 30, '{"tipologia": "publica", "subtipo": "salud", "normas": "ministerio_salud", "equipamiento": "medico"}'::jsonb, 1.30, 'multiplicar', 'global', 'publica'),
  ('Pública - Municipal', 'Factor para edificios municipales', 'tipologia', 25, '{"tipologia": "publica", "subtipo": "municipal", "uso": "administrativo"}'::jsonb, 1.12, 'multiplicar', 'global', 'publica'),
  ('Pública - Deportiva', 'Factor para infraestructura deportiva', 'tipologia', 25, '{"tipologia": "publica", "subtipo": "deportiva", "uso": "recreativo"}'::jsonb, 1.22, 'multiplicar', 'global', 'publica');

-- ============================================================
-- 3. FACTORES ESPECÍFICOS - CLIMA Y SOBRECOSTO
-- ============================================================

-- Factores climáticos
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito)
VALUES 
  ('Factor Clima Frío (>2000msnm)', 'Ajuste por clima frío en alturas altas', 'climatico', 15, '{"altitud": {"operador": "mayor", "valor": "2000"}, "clima": "frio"}'::jsonb, 1.05, 'multiplicar', 'departamento'),
  ('Factor Clima Caliente (<500msnm)', 'Ajuste por clima caliente en zonas bajas', 'climatico', 15, '{"altitud": {"operador": "menor", "valor": "500"}, "clima": "calido"}'::jsonb, 1.03, 'multiplicar', 'departamento'),
  ('Factor Humedad Alta', 'Ajuste por alta humedad (Izabal, costas)', 'climatico', 15, '{"clima": "calido_humedo", "corrosion": "alta"}'::jsonb, 1.04, 'multiplicar', 'departamento'),
  ('Factor Zona Sísmica', 'Ajuste por zona sísmica (Guatemala)', 'climatico', 20, '{"departamento": "Guatemala", "riesgo_sismico": "alto"}'::jsonb, 1.07, 'multiplicar', 'departamento');

-- Sobrecosto estándar
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito)
VALUES 
  ('Sobrecosto Estándar', 'Factor de sobrecosto estándar (32%)', 'sobrecosto', 30, '{}'::jsonb, 1.32, 'multiplicar', 'global'),
  ('Sobrecosto Alto Riesgo', 'Factor para proyectos de alto riesgo', 'sobrecosto', 35, '{"riesgo": "alto", "complejidad": "muy_alta"}'::jsonb, 1.45, 'multiplicar', 'global'),
  ('Sobrecosto Urgente', 'Factor para proyectos urgentes', 'sobrecosto', 40, '{"urgencia": "alta", "plazo": "reducido"}'::jsonb, 1.50, 'multiplicar', 'global');

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Verificar factores por zona
SELECT departamento_id, COUNT(*) as total 
FROM erp_reglas_factores 
WHERE tipo_factor = 'zona' 
GROUP BY departamento_id 
ORDER BY departamento_id;

-- Verificar factores por tipología
SELECT tipologia, COUNT(*) as total 
FROM erp_reglas_factores 
WHERE tipo_factor = 'tipologia' 
GROUP BY tipologia 
ORDER BY tipologia;

-- Verificar total general
SELECT tipo_factor, COUNT(*) as total 
FROM erp_reglas_factores 
GROUP BY tipo_factor 
ORDER BY tipo_factor;

-- RESULTADO ESPERADO:
-- - Zona: 22 factores (1 por departamento)
-- - Tipología: 14 factores (3 residencial, 4 comercial, 3 industrial, 4 civil, 5 pública)
-- - Climático: 4 factores
-- - Sobrecosto: 3 factores
-- - TOTAL: 43 factores