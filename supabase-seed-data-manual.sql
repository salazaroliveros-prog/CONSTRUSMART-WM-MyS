-- ============================================================
-- SEED DATA MANUAL PARA SUPABASE
-- Ejecutar en SQL Editor de Supabase: https://app.supabase.com
-- Proyecto: neygzluxugodiwcuctbj.supabase.co
-- ============================================================
-- DIAGNÓSTICO: Las tablas ya están creadas ✅
-- Los índices ya están creados ✅
-- Las RLS policies ya están creadas ✅
-- Solo falta el seed data (los INSERTs no se persisten vía API)
-- ============================================================

-- Deshabilitar RLS temporalmente para insertar seed data
ALTER TABLE erp_reglas_factores DISABLE ROW LEVEL SECURITY;

-- Seed data para erp_reglas_factores
INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito)
VALUES 
  ('Factor Zona Guatemala', 'Factor base para zona metropolitana Guatemala', 'zona', 10, '{"departamento": "Guatemala"}'::jsonb, 1.0, 'multiplicar', 'departamento'),
  ('Factor Zona Quetzaltenango', 'Factor para altitudes mayores de 2000msnm', 'zona', 10, '{"departamento": "Quetzaltenango", "altitud": {"operador": "mayor", "valor": "2000"}}'::jsonb, 1.12, 'multiplicar', 'departamento'),
  ('Factor Zona Escuintla', 'Factor para zona industrial y caliente', 'zona', 10, '{"departamento": "Escuintla"}'::jsonb, 1.08, 'multiplicar', 'departamento'),
  ('Factor Tipología Residencial', 'Factor base para proyectos residenciales', 'tipologia', 20, '{"tipologia": "residencial"}'::jsonb, 1.0, 'multiplicar', 'global'),
  ('Factor Tipología Comercial', 'Factor para proyectos comerciales', 'tipologia', 20, '{"tipologia": "comercial"}'::jsonb, 1.15, 'multiplicar', 'global'),
  ('Factor Tipología Industrial', 'Factor para proyectos industriales complejos', 'tipologia', 20, '{"tipologia": "industrial"}'::jsonb, 1.35, 'multiplicar', 'global'),
  ('Sobrecosto Estandar', 'Factor de sobrecosto estandar (32%)', 'sobrecosto', 30, '{}'::jsonb, 1.32, 'multiplicar', 'global'),
  ('Factor Clima Frío', 'Ajuste por clima frío (>2000msnm)', 'climatico', 15, '{"altitud": {"operador": "mayor", "valor": "2000"}}'::jsonb, 1.05, 'multiplicar', 'departamento'),
  ('Factor Clima Caliente', 'Ajuste por clima caliente (<500msnm)', 'climatico', 15, '{"altitud": {"operador": "menor", "valor": "500"}}'::jsonb, 1.03, 'multiplicar', 'departamento');

-- Verificar que se insertaron correctamente
SELECT COUNT(*) as total_reglas FROM erp_reglas_factores;

-- Mostrar algunos registros insertados
SELECT nombre, tipo_factor, factor_aplicacion FROM erp_reglas_factores LIMIT 5;

-- Rehabilitar RLS
ALTER TABLE erp_reglas_factores ENABLE ROW LEVEL SECURITY;

-- Resultado esperado: 9 registros insertados