-- ============================================================
-- SCRIPT AUTOMÁTICO: Aplicar Datos Geográficos de Guatemala
-- Ejecutar este script completo en Supabase SQL Editor
-- ============================================================

-- 1. Crear tablas de departamentos y municipios
-- ============================================================

-- Crear tabla de departamentos
CREATE TABLE IF NOT EXISTS erp_departamentos_gt (
  codigo VARCHAR(3) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo_iso VARCHAR(2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de municipios
CREATE TABLE IF NOT EXISTS erp_municipios_gt (
  codigo VARCHAR(5) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  departamento_codigo VARCHAR(3) NOT NULL,
  altitud_msnm INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_municipio_departamento 
    FOREIGN KEY (departamento_codigo) 
    REFERENCES erp_departamentos_gt(codigo)
    ON DELETE CASCADE
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_municipios_departamento 
  ON erp_municipios_gt(departamento_codigo);

CREATE INDEX IF NOT EXISTS idx_municipios_nombre 
  ON erp_municipios_gt(nombre);

-- Habilitar RLS
ALTER TABLE erp_departamentos_gt ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_municipios_gt ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (lectura pública para datos de referencia)
CREATE POLICY IF NOT EXISTS "Departamentos lectura pública" 
  ON erp_departamentos_gt FOR SELECT 
  USING (true);

CREATE POLICY IF NOT EXISTS "Municipios lectura pública" 
  ON erp_municipios_gt FOR SELECT 
  USING (true);

-- Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY IF NOT EXISTS "Departamentos solo admin insert" 
  ON erp_departamentos_gt FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY IF NOT EXISTS "Departamentos solo admin update" 
  ON erp_departamentos_gt FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY IF NOT EXISTS "Departamentos solo admin delete" 
  ON erp_departamentos_gt FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY IF NOT EXISTS "Municipios solo admin insert" 
  ON erp_municipios_gt FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY IF NOT EXISTS "Municipios solo admin update" 
  ON erp_municipios_gt FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

CREATE POLICY IF NOT EXISTS "Municipios solo admin delete" 
  ON erp_municipios_gt FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM erp_configuracion 
      WHERE clave = 'admin_email' 
      AND valor = auth.email()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_departamentos_updated_at ON erp_departamentos_gt;
CREATE TRIGGER trigger_departamentos_updated_at
  BEFORE UPDATE ON erp_departamentos_gt
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_municipios_updated_at ON erp_municipios_gt;
CREATE TRIGGER trigger_municipios_updated_at
  BEFORE UPDATE ON erp_municipios_gt
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_departamentos_gt;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS erp_municipios_gt;

-- Comentario en tablas
COMMENT ON TABLE erp_departamentos_gt IS 'Catálogo de departamentos de Guatemala (datos de referencia)';
COMMENT ON TABLE erp_municipios_gt IS 'Catálogo de municipios de Guatemala con altitud (datos de referencia)';

-- ============================================================
-- 2. Insertar Seed Data - Departamentos de Guatemala
-- ============================================================

INSERT INTO erp_departamentos_gt (codigo, nombre, codigo_iso) VALUES
('01', 'Guatemala', 'GT-GU'),
('02', 'El Progreso', 'GT-PR'),
('03', 'Sacatepéquez', 'GT-SR'),
('04', 'Chimaltenango', 'GT-CM'),
('05', 'Escuintla', 'GT-ES'),
('06', 'Santa Rosa', 'GT-SR'),
('07', 'Sololá', 'GT-SO'),
('08', 'Totonicapán', 'GT-TO'),
('09', 'Quetzaltenango', 'GT-QC'),
('10', 'Suchitepéquez', 'GT-SU'),
('11', 'Retalhuleu', 'GT-RE'),
('12', 'San Marcos', 'GT-SM'),
('13', 'Huehuetenango', 'GT-HU'),
('14', 'Quiché', 'GT-QC'),
('15', 'Baja Verapaz', 'GT-BV'),
('16', 'Alta Verapaz', 'GT-AV'),
('17', 'Petén', 'GT-PE'),
('18', 'Izabal', 'GT-IZ'),
('19', 'Zacapa', 'GT-ZA'),
('20', 'Chiquimula', 'GT-CH'),
('21', 'Jalapa', 'GT-JA'),
('22', 'Jutiapa', 'GT-JU')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 3. Insertar Seed Data - Municipios de Guatemala (Principales)
-- ============================================================

-- Guatemala (01)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('01001', 'Guatemala', '01', 1499),
('01002', 'Mixco', '01', 1500),
('01003', 'Villa Nueva', '01', 1500),
('01004', 'Petapa', '01', 1500),
('01005', 'San Juan Sacatepéquez', '01', 1500),
('01006', 'San Miguel Petapa', '01', 1500),
('01007', 'Chinautla', '01', 1500),
('01008', 'Amatitlán', '01', 1500)
ON CONFLICT (codigo) DO NOTHING;

-- El Progreso (02)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('02001', 'El Progreso', '02', 350),
('02002', 'Morazán', '02', 400),
('02003', 'Sanarate', '02', 450),
('02004', 'San Agustín Acasaguastlán', '02', 500)
ON CONFLICT (codigo) DO NOTHING;

-- Sacatepéquez (03)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('03001', 'Antigua Guatemala', '03', 1533),
('03002', 'Ciudad Vieja', '03', 1500),
('03003', 'Sumpango', '03', 1500),
('03004', 'San Miguel Dueñas', '03', 1500),
('03005', 'Santiago Sacatepéquez', '03', 1500)
ON CONFLICT (codigo) DO NOTHING;

-- Chimaltenango (04)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('04001', 'Chimaltenango', '04', 1800),
('04002', 'San José Chimaltenango', '04', 1800),
('04003', 'Tecpán Guatemala', '04', 2200),
('04004', 'Comalapa', '04', 2000),
('04005', 'Patzún', '04', 2200)
ON CONFLICT (codigo) DO NOTHING;

-- Escuintla (05)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('05001', 'Escuintla', '05', 350),
('05002', 'Santa Lucía Cotzumalguapa', '05', 400),
('05003', 'La Democracia', '05', 450),
('05004', 'Siquinalá', '05', 400),
('05005', 'Nueva Concepción', '05', 350)
ON CONFLICT (codigo) DO NOTHING;

-- Santa Rosa (06)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('06001', 'Cuilapa', '06', 900),
('06002', 'Barberena', '06', 850),
('06003', 'Santa Rosa de Lima', '06', 800),
('06004', 'Casillas', '06', 1000)
ON CONFLICT (codigo) DO NOTHING;

-- Sololá (07)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('07001', 'Sololá', '07', 2100),
('07002', 'Panajachel', '07', 1600),
('07003', 'San Lucas Tolimán', '07', 1700),
('07004', 'San Andrés Semetabaj', '07', 1600)
ON CONFLICT (codigo) DO NOTHING;

-- Totonicapán (08)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('08001', 'Totonicapán', '08', 2200),
('08002', 'San Cristóbal Totonicapán', '08', 2200),
('08003', 'San Francisco El Alto', '08', 2400)
ON CONFLICT (codigo) DO NOTHING;

-- Quetzaltenango (09)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('09001', 'Quetzaltenango', '09', 2330),
('09002', 'San Juan Ostuncalco', '09', 2500),
('09003', 'Salcajá', '09', 2300),
('09004', 'Cantel', '09', 2300),
('09005', 'Olintepeque', '09', 2300)
ON CONFLICT (codigo) DO NOTHING;

-- Suchitepéquez (10)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('10001', 'Mazatenango', '10', 370),
('10002', 'San Bernardino', '10', 400),
('10003', 'San José El Idolo', '10', 350),
('10004', 'San Francisco Zapotitlán', '10', 400)
ON CONFLICT (codigo) DO NOTHING;

-- Retalhuleu (11)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('11001', 'Retalhuleu', '11', 400),
('11002', 'San Sebastián', '11', 450),
('11003', 'Santa Cruz Muluá', '11', 350)
ON CONFLICT (codigo) DO NOTHING;

-- San Marcos (12)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('12001', 'San Marcos', '12', 2500),
('12002', 'San Pedro Sacatepéquez', '12', 2400),
('12003', 'San Miguel Ixtahuacán', '12', 2800),
('12004', 'Comitancillo', '12', 2700)
ON CONFLICT (codigo) DO NOTHING;

-- Huehuetenango (13)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('13001', 'Huehuetenango', '13', 1900),
('13002', 'Chiantla', '13', 2000),
('13003', 'Aguacatán', '13', 1700),
('13004', 'San Sebastián Huehuetenango', '13', 1900)
ON CONFLICT (codigo) DO NOTHING;

-- Quiché (14)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('14001', 'Santa Cruz del Quiché', '14', 2100),
('14002', 'Nebaj', '14', 2000),
('14003', 'Chichicastenango', '14', 2100),
('14004', 'Cantel', '14', 2200)
ON CONFLICT (codigo) DO NOTHING;

-- Baja Verapaz (15)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('15001', 'Salamá', '15', 940),
('15002', 'Cobán', '15', 1320),
('15003', 'San Jerónimo', '15', 900),
('15004', 'Rabinal', '15', 1000)
ON CONFLICT (codigo) DO NOTHING;

-- Alta Verapaz (16)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('16001', 'Cobán', '16', 1320),
('16002', 'San Pedro Carchá', '16', 1300),
('16003', 'San Cristóbal Verapaz', '16', 1400),
('16004', 'Tactic', '16', 1300)
ON CONFLICT (codigo) DO NOTHING;

-- Petén (17)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('17001', 'Flores', '17', 130),
('17002', 'San Benito', '17', 130),
('17003', 'San José', '17', 130),
('17004', 'Santa Elena', '17', 130)
ON CONFLICT (codigo) DO NOTHING;

-- Izabal (18)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('18001', 'Puerto Barrios', '18', 10),
('18002', 'Morales', '18', 50),
('18003', 'El Estor', '18', 100),
('18004', 'Livingston', '18', 5)
ON CONFLICT (codigo) DO NOTHING;

-- Zacapa (19)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('19001', 'Zacapa', '19', 200),
('19002', 'Estanzuela', '19', 250),
('19003', 'Gualán', '19', 150),
('19004', 'Teculután', '19', 200)
ON CONFLICT (codigo) DO NOTHING;

-- Chiquimula (20)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('20001', 'Chiquimula', '20', 400),
('20002', 'Esquipulas', '20', 1000),
('20003', 'Jocotán', '20', 500),
('20004', 'Camotán', '20', 600)
ON CONFLICT (codigo) DO NOTHING;

-- Jalapa (21)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('21001', 'Jalapa', '21', 1400),
('21002', 'San Pedro Pinula', '21', 1300),
('21003', 'San Luis Jilotepeque', '21', 1200)
ON CONFLICT (codigo) DO NOTHING;

-- Jutiapa (22)
INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
('22001', 'Jutiapa', '22', 700),
('22002', 'Asunción Mita', '22', 400),
('22003', 'Agua Blanca', '22', 600),
('22004', 'Atescatempa', '22', 800)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- 4. Verificación
-- ============================================================

-- Verificar departamentos insertados
DO $$
DECLARE
  dept_count INTEGER;
  muni_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dept_count FROM erp_departamentos_gt;
  SELECT COUNT(*) INTO muni_count FROM erp_municipios_gt;
  
  RAISE NOTICE '✅ Datos geográficos insertados exitosamente';
  RAISE NOTICE '   - Departamentos: %', dept_count;
  RAISE NOTICE '   - Municipios: %', muni_count;
  
  IF dept_count = 22 AND muni_count >= 90 THEN
    RAISE NOTICE '✅ VERIFICACIÓN COMPLETADA: Todos los datos geográficos están listos';
  ELSE
    RAISE NOTICE '⚠️  VERIFICACIÓN PARCIAL: Algunos datos pueden estar faltando';
  END IF;
END $$;
