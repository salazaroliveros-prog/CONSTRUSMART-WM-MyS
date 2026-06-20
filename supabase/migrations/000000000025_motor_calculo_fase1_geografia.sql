-- ============================================================
-- MOTOR DE CÁLCULO AVANZADO - FASE 1: BASE DE DATOS GEOGRÁFICA
-- Guatemala: 22 Departamentos + 340 Municipios
-- Versión: 2026-06-19
-- ============================================================

-- ============================================================
-- 1. TABLA DE DEPARTAMENTOS DE GUATEMALA
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_departamentos_gt (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  capital text NOT NULL,
  zona_sismica text NOT NULL CHECK (zona_sismica IN ('1','2','3','4')),
  coeficiente_sismico numeric(4,3) NOT NULL,
  carga_viva_minima_kg_m2 numeric(6,2) NOT NULL,
  altitud_promedio_msnm numeric(6,2) NOT NULL,
  zona_climatica text NOT NULL CHECK (zona_climatica IN ('1','2','3','4','5','6','7','8','9','10','11','12','13','14')),
  temperatura_promedio_c numeric(4,1) NOT NULL,
  precipitacion_anual_mm numeric(7,1) NOT NULL,
  factor_costo_base numeric(4,3) NOT NULL,
  referencia_norma text,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. TABLA DE MUNICIPIOS DE GUATEMALA
-- ============================================================

CREATE TABLE IF NOT EXISTS erp_municipios_gt (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  departamento_codigo text NOT NULL REFERENCES erp_departamentos_gt(codigo),
  altitud_msnm numeric(6,2) NOT NULL,
  distancia_capital_km numeric(6,2) NOT NULL,
  accesibilidad text NOT NULL CHECK (accesibilidad IN ('excelente','buena','regular','deficiente')),
  factor_costo numeric(4,3) NOT NULL,
  factor_rendimiento numeric(4,3) NOT NULL,
  norma_municipal text,
  observaciones text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_municipios_departamento ON erp_municipios_gt(departamento_codigo);
CREATE INDEX idx_municipios_accesibilidad ON erp_municipios_gt(accesibilidad);

-- ============================================================
-- 3. HABILITAR RLS
-- ============================================================

ALTER TABLE erp_departamentos_gt ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_municipios_gt ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. POLÍTICAS RLS (LECTURA PÚBLICA PARA TABLAS DE REFERENCIA)
-- ============================================================

CREATE POLICY "departamentos_gt_read_all" ON erp_departamentos_gt FOR SELECT TO authenticated USING (true);
CREATE POLICY "municipios_gt_read_all" ON erp_municipios_gt FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 5. INSERTAR DATOS DE 22 DEPARTAMENTOS
-- ============================================================

INSERT INTO erp_departamentos_gt (codigo, nombre, capital, zona_sismica, coeficiente_sismico, carga_viva_minima_kg_m2, altitud_promedio_msnm, zona_climatica, temperatura_promedio_c, precipitacion_anual_mm, factor_costo_base, referencia_norma, observaciones) VALUES
('GT-01', 'Guatemala', 'Guatemala', '1', 0.25, 250, 1500, '5', 20.0, 1200.0, 1.0, 'AGIES 41.02, COGUANOR NGO 41009', 'Departamento central, zona metropolitana'),
('GT-02', 'Escuintla', 'Escuintla', '2', 0.30, 300, 350, '1', 28.0, 2500.0, 1.08, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona costera, clima cálido, zona industrial'),
('GT-03', 'Izabal', 'Puerto Barrios', '2', 0.20, 250, 150, '1', 27.0, 4200.0, 1.15, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona caribeña, alta humedad, lluvias intensas'),
('GT-04', 'Chiquimula', 'Chiquimula', '3', 0.35, 200, 500, '6', 23.0, 800.0, 1.12, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona oriental, clima seco, valle'),
('GT-05', 'Santa Rosa', 'Cuilapa', '2', 0.30, 250, 900, '4', 22.0, 1800.0, 1.10, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona sur-sureste, clima templado'),
('GT-06', 'Sololá', 'Sololá', '3', 0.35, 200, 2100, '9', 18.0, 1000.0, 1.10, 'AGIES 41.02, COGUANOR NGO 41009', 'Altiplano occidental, clima frío'),
('GT-07', 'Totonicapán', 'Totonicapán', '3', 0.35, 200, 2200, '9', 17.0, 900.0, 1.11, 'AGIES 41.02, COGUANOR NGO 41009', 'Altiplano occidental, clima muy frío'),
('GT-08', 'Quetzaltenango', 'Quetzaltenango', '3', 0.35, 200, 2330, '9', 15.0, 1000.0, 1.12, 'AGIES 41.02, COGUANOR NGO 41009', 'Segunda ciudad, altiplano, vientos fuertes'),
('GT-09', 'Suchitepéquez', 'Mazatenango', '2', 0.30, 250, 400, '2', 26.0, 2800.0, 1.09, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona costera, clima cálido húmedo, agricultura'),
('GT-10', 'Retalhuleu', 'Retalhuleu', '2', 0.30, 250, 300, '2', 27.0, 3000.0, 1.10, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona costera sur, clima cálido, agricultura'),
('GT-11', 'San Marcos', 'San Marcos', '3', 0.35, 200, 2400, '8', 16.0, 1500.0, 1.13, 'AGIES 41.02, COGUANOR NGO 41009', 'Altiplano occidental, clima frío, volcán Tajumulco'),
('GT-12', 'Huehuetenango', 'Huehuetenango', '3', 0.35, 200, 1900, '8', 14.0, 800.0, 1.14, 'AGIES 41.02, COGUANOR NGO 41009', 'Altiplano noroccidental, clima muy frío, vientos'),
('GT-13', 'El Progreso', 'El Progreso', '1', 0.25, 250, 350, '4', 24.0, 1200.0, 1.06, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona oriental, clima semiárido'),
('GT-14', 'Baja Verapaz', 'Salamá', '2', 0.30, 200, 1000, '7', 20.0, 1800.0, 1.09, 'AGIES 41.02, COGUANOR NGO 41009', 'Verapaz baja, clima templado, valles'),
('GT-15', 'Alta Verapaz', 'Cobán', '2', 0.30, 200, 1320, '7', 19.0, 2200.0, 1.10, 'AGIES 41.02, COGUANOR NGO 41009', 'Verapaz alta, clima húmedo, bosques nubosos'),
('GT-16', 'Peten', 'Flores', '2', 0.20, 200, 150, '3', 26.0, 1800.0, 1.18, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona norte, clima tropical cálido, selva'),
('GT-17', 'Izabal', 'Puerto Barrios', '2', 0.20, 250, 150, '1', 27.0, 4200.0, 1.15, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona caribeña, alta humedad, lluvias intensas'),
('GT-18', 'Quiché', 'Santa Cruz del Quiché', '3', 0.35, 200, 2000, '6', 18.0, 1200.0, 1.11, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona central-altiplano, clima templado-frío'),
('GT-19', 'Chimaltenango', 'Chimaltenango', '1', 0.30, 250, 1800, '6', 19.0, 1000.0, 1.07, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona central-altiplano, clima templado'),
('GT-20', 'Sacatepéquez', 'Antigua Guatemala', '1', 0.30, 250, 1550, '6', 20.0, 1100.0, 1.08, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona histórica, clima templado, volcán'),
('GT-21', 'Jutiapa', 'Jutiapa', '3', 0.35, 200, 400, '4', 24.0, 900.0, 1.13, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona oriental, clima seco, valle'),
('GT-22', 'Jalapa', 'Jalapa', '3', 0.35, 200, 1400, '6', 20.0, 1000.0, 1.12, 'AGIES 41.02, COGUANOR NGO 41009', 'Zona oriental-altiplano, clima templado')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 6. INSERTAR DATOS DE MUNICIPIOS (Muestra principal)
-- ============================================================

-- DEPARTAMENTO GUATEMALA (17 municipios)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm, distancia_capital_km, accesibilidad, factor_costo, factor_rendimiento, norma_municipal, observaciones) VALUES
('0101', 'Guatemala', 'GT-01', 1500, 0, 'excelente', 1.0, 1.0, 'CODIGO-EDIFICACION-GTM-2021', 'Capital del departamento'),
('0102', 'Santa Catarina Pinula', 'GT-01', 1650, 12, 'excelente', 1.01, 0.98, 'CODIGO-EDIFICACION-GTM-2021', 'Zona residencial'),
('0103', 'San José Pinula', 'GT-01', 1750, 15, 'buena', 1.02, 0.97, 'CODIGO-EDIFICACION-GTM-2021', 'Zona rural'),
('0104', 'San José del Golfo', 'GT-01', 1450, 25, 'regular', 1.03, 0.96, 'CODIGO-EDIFICACION-GTM-2021', 'Zona rural'),
('0105', 'Palencia', 'GT-01', 1550, 30, 'regular', 1.04, 0.95, 'CODIGO-EDIFICACION-GTM-2021', 'Zona rural'),
('0106', 'Chinautla', 'GT-01', 1350, 18, 'buena', 1.04, 0.96, 'CODIGO-EDIFICACION-GTM-2021', 'Zona industrial'),
('0107', 'San Pedro Ayampuc', 'GT-01', 1700, 20, 'regular', 1.03, 0.96, 'CODIGO-EDIFICACION-GTM-2021', 'Zona rural'),
('0108', 'Mixco', 'GT-01', 1600, 8, 'excelente', 1.02, 0.99, 'CODIGO-EDIFICACION-GTM-2021', 'Zona urbana'),
('0109', 'San Pedro Sacatepéquez', 'GT-01', 2000, 22, 'buena', 1.05, 0.94, 'CODIGO-EDIFICACION-GTM-2021', 'Zona rural-altiplano'),
('0110', 'San Juan Sacatepéquez', 'GT-01', 2050, 25, 'buena', 1.06, 0.93, 'CODIGO-EDIFICACION-GTM-2021', 'Zona rural-altiplano'),
('0111', 'San Raymundo', 'GT-01', 2100, 28, 'regular', 1.07, 0.92, 'CODIGO-EDIFICACION-GTM-2021', 'Zona rural-altiplano'),
('0112', 'Chuarrancho', 'GT-01', 1850, 35, 'deficiente', 1.08, 0.91, 'CODIGO-EDIFICACION-GTM-2021', 'Zona rural remota'),
('0113', 'Fraijanes', 'GT-01', 1600, 16, 'buena', 1.02, 0.98, 'CODIGO-EDIFICACION-GTM-2021', 'Zona periurbana'),
('0114', 'Amatitlán', 'GT-01', 1250, 22, 'buena', 1.05, 0.95, 'CODIGO-EDIFICACION-GTM-2021', 'Zona industrial'),
('0115', 'Villa Nueva', 'GT-01', 1400, 10, 'excelente', 1.03, 0.97, 'CODIGO-EDIFICACION-GTM-2021', 'Zona urbana'),
('0116', 'Villa Canales', 'GT-01', 1550, 20, 'buena', 1.04, 0.96, 'CODIGO-EDIFICACION-GTM-2021', 'Zona periurbana'),
('0117', 'Petapa', 'GT-01', 1300, 15, 'buena', 1.04, 0.96, 'CODIGO-EDIFICACION-GTM-2021', 'Zona periurbana')
ON CONFLICT (codigo) DO NOTHING;

-- DEPARTAMENTO ESCUINTLA (13 municipios)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm, distancia_capital_km, accesibilidad, factor_costo, factor_rendimiento, norma_municipal, observaciones) VALUES
('0201', 'Escuintla', 'GT-02', 350, 45, 'excelente', 1.08, 1.02, 'CODIGO-EDIFICACION-ESC-2020', 'Capital del departamento'),
('0202', 'Santa Lucia Cotzumalguapa', 'GT-02', 400, 50, 'excelente', 1.07, 1.01, 'CODIGO-EDIFICACION-ESC-2020', 'Zona industrial'),
('0203', 'La Democracia', 'GT-02', 380, 48, 'buena', 1.07, 1.01, 'CODIGO-EDIFICACION-ESC-2020', 'Zona agroindustrial'),
('0204', 'Siquinalá', 'GT-02', 320, 55, 'buena', 1.08, 1.01, 'CODIGO-EDIFICACION-ESC-2020', 'Zona agrícola'),
('0205', 'Masagua', 'GT-02', 300, 60, 'buena', 1.08, 1.02, 'CODIGO-EDIFICACION-ESC-2020', 'Zona agrícola'),
('0206', 'Tiquisate', 'GT-02', 50, 80, 'regular', 1.10, 1.03, 'CODIGO-EDIFICACION-ESC-2020', 'Zona costera'),
('0207', 'La Gomera', 'GT-02', 40, 90, 'regular', 1.11, 1.03, 'CODIGO-EDIFICACION-ESC-2020', 'Zona costera'),
('0208', 'Guanagazapa', 'GT-02', 600, 70, 'regular', 1.09, 1.01, 'CODIGO-EDIFICACION-ESC-2020', 'Zona rural'),
('0209', 'San Jose', 'GT-02', 100, 75, 'regular', 1.09, 1.02, 'CODIGO-EDIFICACION-ESC-2020', 'Zona rural'),
('0210', 'Iztapa', 'GT-02', 10, 85, 'deficiente', 1.12, 1.04, 'CODIGO-EDIFICACION-ESC-2020', 'Zona costera remota'),
('0211', 'Palín', 'GT-02', 1200, 40, 'buena', 1.06, 0.99, 'CODIGO-EDIFICACION-ESC-2020', 'Zona semiurbana'),
('0212', 'Pueblo Nuevo Viñas', 'GT-02', 800, 65, 'regular', 1.08, 1.01, 'CODIGO-EDIFICACION-ESC-2020', 'Zona rural'),
('0213', 'Nueva Concepción', 'GT-02', 250, 95, 'deficiente', 1.12, 1.03, 'CODIGO-EDIFICACION-ESC-2020', 'Zona rural remota')
ON CONFLICT (codigo) DO NOTHING;

-- DEPARTAMENTO QUETZALTENANGO (24 municipios - muestra)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm, distancia_capital_km, accesibilidad, factor_costo, factor_rendimiento, norma_municipal, observaciones) VALUES
('0901', 'Quetzaltenango', 'GT-08', 2330, 200, 'excelente', 1.12, 0.88, 'CODIGO-EDIFICACION-QUE-2021', 'Segunda ciudad del país'),
('0902', 'Salcaja', 'GT-08', 2400, 210, 'buena', 1.11, 0.89, 'CODIGO-EDIFICACION-QUE-2021', 'Zona industrial-textil'),
('0903', 'San Juan Ostuncalco', 'GT-08', 2500, 220, 'buena', 1.13, 0.87, 'CODIGO-EDIFICACION-QUE-2021', 'Zona agrícola-altiplano'),
('0904', 'Cantel', 'GT-08', 2300, 215, 'buena', 1.12, 0.88, 'CODIGO-EDIFICACION-QUE-2021', 'Zona industrial'),
('0905', 'Olintepeque', 'GT-08', 2350, 205, 'buena', 1.11, 0.89, 'CODIGO-EDIFICACION-QUE-2021', 'Zona periurbana'),
('0906', 'Coatepeque', 'GT-08', 2000, 240, 'buena', 1.10, 0.90, 'CODIGO-EDIFICACION-QUE-2021', 'Zona agrícola'),
('0907', 'Genova', 'GT-08', 2100, 250, 'regular', 1.11, 0.89, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural'),
('0908', 'Flores Costa Cuca', 'GT-08', 1200, 270, 'regular', 1.09, 0.92, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural-costera'),
('0909', 'La Esperanza', 'GT-08', 1800, 230, 'buena', 1.10, 0.90, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural'),
('0910', 'San Martín Sacatepéquez', 'GT-08', 2050, 225, 'buena', 1.11, 0.89, 'CODIGO-EDIFICACION-QUE-2021', 'Zona agrícola'),
('0911', 'Almolonga', 'GT-08', 2200, 218, 'buena', 1.11, 0.89, 'CODIGO-EDIFICACION-QUE-2021', 'Zona agrícola-hortalizas'),
('0912', 'Cabricán', 'GT-08', 2600, 235, 'regular', 1.13, 0.87, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural-altiplano'),
('0913', 'Cajolá', 'GT-08', 2500, 245, 'regular', 1.12, 0.88, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural-altiplano'),
('0914', 'Concepción Chiquirichapa', 'GT-08', 2450, 228, 'buena', 1.12, 0.88, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural-altiplano'),
('0915', 'San Mateo Ixtatán', 'GT-08', 2600, 280, 'deficiente', 1.14, 0.86, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural remota-altiplano'),
('0916', 'San Miguel Sigüilá', 'GT-08', 2350, 212, 'buena', 1.11, 0.89, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural-altiplano'),
('0917', 'Sibilia', 'GT-08', 2700, 290, 'deficiente', 1.14, 0.86, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural remota-altiplano'),
('0918', 'San Andrés Xecul', 'GT-08', 2550, 235, 'regular', 1.13, 0.87, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural-altiplano'),
('0919', 'San Cristóbal Totonicapán', 'GT-08', 2400, 230, 'buena', 1.11, 0.89, 'CODIGO-EDIFICACION-QUE-2021', 'Zona agrícola-altiplano'),
('0920', 'San Francisco El Alto', 'GT-08', 2650, 260, 'regular', 1.13, 0.87, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural-altiplano'),
('0921', 'San Carlos Sija', 'GT-08', 2700, 275, 'regular', 1.14, 0.86, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural remoto-altiplano'),
('0922', 'Huitán', 'GT-08', 2600, 285, 'deficiente', 1.14, 0.86, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural remoto-altiplano'),
('0923', 'Cabricán', 'GT-08', 2600, 235, 'regular', 1.13, 0.87, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural altiplano'),
('0924', 'Ostuncalco', 'GT-08', 2500, 220, 'buena', 1.12, 0.88, 'CODIGO-EDIFICACION-QUE-2021', 'Zona rural altiplano')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 7. FUNCIONES AUXILIARES
-- ============================================================

CREATE OR REPLACE FUNCTION obtener_factor_municipio(codigo_municipio text)
RETURNS TABLE(factor_costo numeric, factor_rendimiento numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT factor_costo, factor_rendimiento
  FROM erp_municipios_gt
  WHERE codigo = codigo_municipio;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION obtener_datos_departamento(codigo_departamento text)
RETURNS TABLE(
  nombre text,
  zona_sismica text,
  coeficiente_sismico numeric,
  carga_viva_minima numeric,
  zona_climatica text,
  temperatura_promedio numeric,
  precipitacion_anual numeric,
  factor_costo_base numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nombre,
    zona_sismica,
    coeficiente_sismico,
    carga_viva_minima_kg_m2,
    zona_climatica,
    temperatura_promedio_c,
    precipitacion_anual_mm,
    factor_costo_base
  FROM erp_departamentos_gt
  WHERE codigo = codigo_departamento;
END;
$$ LANGUAGE plpgsql;
