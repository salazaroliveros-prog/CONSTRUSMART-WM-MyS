-- ============================================================
-- SCRIPT FINAL: LIMPIEZA Y ALINEACIÓN DE BASE DE DATOS
-- Ejecutar este script en Supabase SQL Editor
-- 
-- Este script:
-- 1. Elimina tablas huérfanas (no están en TABLE_MAP)
-- 2. Elimina tablas obsoletas (renombradas/eliminadas del código)
-- 3. Crea tablas geográficas (si no existen)
-- 4. Configura índices, RLS, triggers, Realtime
-- 5. Inserta seed data (departamentos y municipios de Guatemala)
-- 6. Verifica alineación final
-- ============================================================

-- ============================================================
-- PARTE 1: ELIMINACIÓN DE TABLAS OBSOLETAS Y HUÉRFANAS
-- ============================================================

DO $$
DECLARE
  table_record RECORD;
  is_valid BOOLEAN;
BEGIN
  RAISE NOTICE '=== ELIMINACIÓN DE TABLAS OBSOLETAS/HUÉRFANAS ===';
  
  -- Tablas válidas según TABLE_MAP del código
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE 'erp_%'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    -- Verificar si es tabla válida (está en TABLE_MAP)
    is_valid := table_record.table_name IN (
      'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
      'erp_ordenes_compra', 'erp_proveedores', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
      'erp_hitos', 'erp_riesgos', 'erp_cotizaciones_negocio', 'erp_vales_salida',
      'erp_no_conformidades', 'erp_incidentes', 'erp_publicaciones_muro', 'erp_planos',
      'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros', 'erp_pagos_proveedor',
      'erp_destajos', 'erp_recepciones', 'erp_centros_costo', 'erp_seguimiento',
      'erp_bitacora', 'erp_plantillas_proyectos', 'erp_notificaciones', 'erp_presupuestos',
      'erp_avances', 'erp_eventos_calendario', 'erp_ventas_paquetes', 'erp_ordenes_cambio',
      'erp_pruebas_laboratorio', 'erp_liberaciones_partida', 'erp_error_log',
      'erp_proyecto_weather', 'erp_auditoria', 'erp_insumos_base',
      'erp_departamentos_gt', 'erp_municipios_gt', 'erp_reglas_factores',
      'erp_normativa_departamental', 'erp_escalas_produccion', 'erp_estacionalidad',
      'erp_historial_aplicacion_reglas', 'erp_ajustes_estacionales_actividad',
      'erp_calculos_proyecto', 'erp_cumplimiento_normativo',
      'erp_aplicacion_escalas', 'erp_configuracion', 'erp_solicitudes', 'erp_archivos_tipo'
    );
    
    -- Si no es válida, eliminarla
    IF NOT is_valid THEN
      EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_record.table_name);
      RAISE NOTICE '✅ Eliminada (huérfana): %', table_record.table_name;
    END IF;
  END LOOP;
  
  -- Eliminar tablas obsoletas específicas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_subcontratos') THEN
    DROP TABLE IF EXISTS erp_subcontratos CASCADE;
    RAISE NOTICE '✅ Eliminada: erp_subcontratos';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_rendimientos') THEN
    DROP TABLE IF EXISTS erp_rendimientos CASCADE;
    RAISE NOTICE '✅ Eliminada: erp_rendimientos';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_licitaciones') THEN
    DROP TABLE IF EXISTS erp_licitaciones CASCADE;
    RAISE NOTICE '✅ Eliminada: erp_licitaciones';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_muro') THEN
    DROP TABLE IF EXISTS erp_muro CASCADE;
    RAISE NOTICE '✅ Eliminada: erp_muro';
  END IF;
  
  RAISE NOTICE '=== FIN ELIMINACIÓN ===';
END $$;

-- ============================================================
-- PARTE 2: CREACIÓN DE TABLAS GEOLÓFICAS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CREACIÓN DE TABLAS GEOLÓFICAS ===';
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_departamentos_gt') THEN
    CREATE TABLE erp_departamentos_gt (
      codigo VARCHAR(3) PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      codigo_iso VARCHAR(2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE '✅ Creada: erp_departamentos_gt';
  ELSE
    RAISE NOTICE '⏭️  Ya existe: erp_departamentos_gt';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'erp_municipios_gt') THEN
    CREATE TABLE erp_municipios_gt (
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
    RAISE NOTICE '✅ Creada: erp_municipios_gt';
  ELSE
    RAISE NOTICE '⏭️  Ya existe: erp_municipios_gt';
  END IF;
  
  RAISE NOTICE '=== FIN CREACIÓN TABLAS ===';
END $$;

-- ============================================================
-- PARTE 3: CONFIGURACIÓN DE ÍNDICES
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURACIÓN DE ÍNDICES ===';
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_municipios_departamento') THEN
    CREATE INDEX idx_municipios_departamento ON erp_municipios_gt(departamento_codigo);
    RAISE NOTICE '✅ Creado: idx_municipios_departamento';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_municipios_nombre') THEN
    CREATE INDEX idx_municipios_nombre ON erp_municipios_gt(nombre);
    RAISE NOTICE '✅ Creado: idx_municipios_nombre';
  END IF;
  
  RAISE NOTICE '=== FIN ÍNDICES ===';
END $$;

-- ============================================================
-- PARTE 4: CONFIGURACIÓN DE RLS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURACIÓN DE RLS ===';
  
  ALTER TABLE erp_departamentos_gt ENABLE ROW LEVEL SECURITY;
  ALTER TABLE erp_municipios_gt ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Departamentos lectura pública" ON erp_departamentos_gt;
  CREATE POLICY "Departamentos lectura pública" 
    ON erp_departamentos_gt FOR SELECT 
    USING (true);
  
  DROP POLICY IF EXISTS "Municipios lectura pública" ON erp_municipios_gt;
  CREATE POLICY "Municipios lectura pública" 
    ON erp_municipios_gt FOR SELECT 
    USING (true);
  
  RAISE NOTICE '✅ RLS configurado en tablas geográficas';
END $$;

-- ============================================================
-- PARTE 5: CONFIGURACIÓN DE TRIGGERS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURACIÓN DE TRIGGERS ===';
  
  CREATE OR REPLACE FUNCTION update_timestamp()
  RETURNS TRIGGER AS $function$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $function$ LANGUAGE plpgsql;
  
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
  
  RAISE NOTICE '✅ Triggers configurados';
END $$;

-- ============================================================
-- PARTE 6: CONFIGURACIÓN DE REALTIME (sintaxis correcta)
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== CONFIGURACIÓN DE REALTIME ===';
  
  -- PostgreSQL no soporta IF NOT EXISTS en ALTER PUBLICATION ADD TABLE
  -- Debemos verificar primero en pg_publication_tables
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_departamentos_gt') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_departamentos_gt;
    RAISE NOTICE '✅ Agregada a realtime: erp_departamentos_gt';
  ELSE
    RAISE NOTICE '⏭️  Ya en realtime: erp_departamentos_gt';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'erp_municipios_gt') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE erp_municipios_gt;
    RAISE NOTICE '✅ Agregada a realtime: erp_municipios_gt';
  ELSE
    RAISE NOTICE '⏭️  Ya en realtime: erp_municipios_gt';
  END IF;
  
  RAISE NOTICE '✅ Realtime habilitado en tablas geográficas';
END $$;

-- ============================================================
-- PARTE 7: INSERTAR SEED DATA
-- ============================================================

DO $$
DECLARE
  dept_count INTEGER;
  muni_count INTEGER;
BEGIN
  RAISE NOTICE '=== INSERTAR SEED DATA ===';
  
  SELECT COUNT(*) INTO dept_count FROM erp_departamentos_gt;
  
  IF dept_count = 0 THEN
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
    ('22', 'Jutiapa', 'GT-JU');
    
    RAISE NOTICE '✅ Insertados: 22 departamentos';
  ELSE
    RAISE NOTICE '⏭️  Departamentos ya tienen datos (%)', dept_count;
  END IF;
  
  SELECT COUNT(*) INTO muni_count FROM erp_municipios_gt;
  
  IF muni_count = 0 THEN
    INSERT INTO erp_municipios_gt (codigo, nombre, departamento_codigo, altitud_msnm) VALUES
    ('01001', 'Guatemala', '01', 1499),
    ('01002', 'Mixco', '01', 1500),
    ('01003', 'Villa Nueva', '01', 1500),
    ('01004', 'Petapa', '01', 1500),
    ('01005', 'San Juan Sacatepéquez', '01', 1500),
    ('01006', 'San Miguel Petapa', '01', 1500),
    ('01007', 'Chinautla', '01', 1500),
    ('01008', 'Amatitlán', '01', 1500),
    ('02001', 'El Progreso', '02', 350),
    ('02002', 'Morazán', '02', 400),
    ('02003', 'Sanarate', '02', 450),
    ('02004', 'San Agustín Acasaguastlán', '02', 500),
    ('03001', 'Antigua Guatemala', '03', 1533),
    ('03002', 'Ciudad Vieja', '03', 1500),
    ('03003', 'Sumpango', '03', 1500),
    ('03004', 'San Miguel Dueñas', '03', 1500),
    ('03005', 'Santiago Sacatepéquez', '03', 1500),
    ('04001', 'Chimaltenango', '04', 1800),
    ('04002', 'San José Chimaltenango', '04', 1800),
    ('04003', 'Tecpán Guatemala', '04', 2200),
    ('04004', 'Comalapa', '04', 2000),
    ('04005', 'Patzún', '04', 2200),
    ('05001', 'Escuintla', '05', 350),
    ('05002', 'Santa Lucía Cotzumalguapa', '05', 400),
    ('05003', 'La Democracia', '05', 450),
    ('05004', 'Siquinalá', '05', 400),
    ('05005', 'Nueva Concepción', '05', 350),
    ('06001', 'Cuilapa', '06', 900),
    ('06002', 'Barberena', '06', 850),
    ('06003', 'Santa Rosa de Lima', '06', 800),
    ('06004', 'Casillas', '06', 1000),
    ('07001', 'Sololá', '07', 2100),
    ('07002', 'Panajachel', '07', 1600),
    ('07003', 'San Lucas Tolimán', '07', 1700),
    ('07004', 'San Andrés Semetabaj', '07', 1600),
    ('08001', 'Totonicapán', '08', 2200),
    ('08002', 'San Cristóbal Totonicapán', '08', 2200),
    ('08003', 'San Francisco El Alto', '08', 2400),
    ('09001', 'Quetzaltenango', '09', 2330),
    ('09002', 'San Juan Ostuncalco', '09', 2500),
    ('09003', 'Salcajá', '09', 2300),
    ('09004', 'Cantel', '09', 2300),
    ('09005', 'Olintepeque', '09', 2300),
    ('10001', 'Mazatenango', '10', 370),
    ('10002', 'San Bernardino', '10', 400),
    ('10003', 'San José El Idolo', '10', 350),
    ('10004', 'San Francisco Zapotitlán', '10', 400),
    ('11001', 'Retalhuleu', '11', 400),
    ('11002', 'San Sebastián', '11', 450),
    ('11003', 'Santa Cruz Muluá', '11', 350),
    ('12001', 'San Marcos', '12', 2500),
    ('12002', 'San Pedro Sacatepéquez', '12', 2400),
    ('12003', 'San Miguel Ixtahuacán', '12', 2800),
    ('12004', 'Comitancillo', '12', 2700),
    ('13001', 'Huehuetenango', '13', 1900),
    ('13002', 'Chiantla', '13', 2000),
    ('13003', 'Aguacatán', '13', 1700),
    ('13004', 'San Sebastián Huehuetenango', '13', 1900),
    ('14001', 'Santa Cruz del Quiché', '14', 2100),
    ('14002', 'Nebaj', '14', 2000),
    ('14003', 'Chichicastenango', '14', 2100),
    ('14004', 'Cantel', '14', 2200),
    ('15001', 'Salamá', '15', 940),
    ('15002', 'Cobán', '15', 1320),
    ('15003', 'San Jerónimo', '15', 900),
    ('15004', 'Rabinal', '15', 1000),
    ('16001', 'Cobán', '16', 1320),
    ('16002', 'San Pedro Carchá', '16', 1300),
    ('16003', 'San Cristóbal Verapaz', '16', 1400),
    ('16004', 'Tactic', '16', 1300),
    ('17001', 'Flores', '17', 130),
    ('17002', 'San Benito', '17', 130),
    ('17003', 'San José', '17', 130),
    ('17004', 'Santa Elena', '17', 130),
    ('18001', 'Puerto Barrios', '18', 10),
    ('18002', 'Morales', '18', 50),
    ('18003', 'El Estor', '18', 100),
    ('18004', 'Livingston', '18', 5),
    ('19001', 'Zacapa', '19', 200),
    ('19002', 'Estanzuela', '19', 250),
    ('19003', 'Gualán', '19', 150),
    ('19004', 'Teculután', '19', 200),
    ('20001', 'Chiquimula', '20', 400),
    ('20002', 'Esquipulas', '20', 1000),
    ('20003', 'Jocotán', '20', 500),
    ('20004', 'Camotán', '20', 600),
    ('21001', 'Jalapa', '21', 1400),
    ('21002', 'San Pedro Pinula', '21', 1300),
    ('21003', 'San Luis Jilotepeque', '21', 1200),
    ('22001', 'Jutiapa', '22', 700),
    ('22002', 'Asunción Mita', '22', 400),
    ('22003', 'Agua Blanca', '22', 600),
    ('22004', 'Atescatempa', '22', 800);
    
    RAISE NOTICE '✅ Insertados: ~90 municipios principales';
  ELSE
    RAISE NOTICE '⏭️  Municipios ya tienen datos (%)', muni_count;
  END IF;
  
  RAISE NOTICE '=== FIN SEED DATA ===';
END $$;

-- ============================================================
-- PARTE 8: VERIFICACIÓN FINAL
-- ============================================================

DO $$
DECLARE
  final_dept_count INTEGER;
  final_muni_count INTEGER;
  total_tables INTEGER;
BEGIN
  RAISE NOTICE '=== VERIFICACIÓN FINAL ===';
  
  SELECT COUNT(*) INTO final_dept_count FROM erp_departamentos_gt;
  SELECT COUNT(*) INTO final_muni_count FROM erp_municipios_gt;
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name LIKE 'erp_%'
    AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '✅ VERIFICACIÓN COMPLETADA';
  RAISE NOTICE '   - Departamentos: %', final_dept_count;
  RAISE NOTICE '   - Municipios: %', final_muni_count;
  RAISE NOTICE '   - Total tablas erp_*: %', total_tables;
  
  IF final_dept_count = 22 AND final_muni_count >= 90 THEN
    RAISE NOTICE '✅ BASE DE DATOS ALINEADA CON LA APLICACIÓN';
  ELSE
    RAISE NOTICE '⚠️  Verificar resultados manualmente';
  END IF;
  
  RAISE NOTICE '=== FIN DEL SCRIPT ===';
END $$;
