-- ============================================================
-- ERP CONSTRUSMART - Seed Data (INSERT condicional)
-- Versión: 1.2.0
-- Solo inserta si las tablas están vacías
-- ============================================================

-- ============================================================
-- PARTE 1: CREAR TABLAS FALTANTES PARA SEED DATA
-- ============================================================

-- Catálogo de insumos base (24 registros)
CREATE TABLE IF NOT EXISTS erp_insumos_base (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  nombre text NOT NULL,
  categoria text NOT NULL,
  unidad text NOT NULL,
  precio_referencia numeric(10,2) NOT NULL DEFAULT 0,
  rubro text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  fecha_actualizacion date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE erp_insumos_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insumos_base_read" ON erp_insumos_base FOR SELECT TO authenticated USING (true);
CREATE POLICY "insumos_base_write" ON erp_insumos_base FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

-- Rendimientos de cuadrilla (15 registros)
CREATE TABLE IF NOT EXISTS erp_rendimientos_cuadrilla (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  actividad text NOT NULL,
  cuadrilla text NOT NULL,
  rendimiento_diario numeric(10,2) NOT NULL DEFAULT 0,
  unidad text NOT NULL
);

ALTER TABLE erp_rendimientos_cuadrilla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rendimientos_read" ON erp_rendimientos_cuadrilla FOR SELECT TO authenticated USING (true);
CREATE POLICY "rendimientos_write" ON erp_rendimientos_cuadrilla FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.rol IN ('Administrador', 'Gerente'))
);

-- ============================================================
-- PARTE 2: SEED DATA — PROYECTOS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_proyectos LIMIT 1) THEN
    INSERT INTO erp_proyectos (id, nombre, cliente, ubicacion, tipologia, estado, presupuesto_total, monto_contrato, avance_fisico, avance_financiero, lat, lng, fecha_inicio, fecha_fin) VALUES
      ('00000000-0000-0000-0000-000000000001', 'Residencial Las Cumbres', 'Inversiones GT', 'Ciudad de Guatemala', 'residencial', 'ejecucion', 4850000, 5800000, 62, 58, 14.6349, -90.5069, '2026-01-15', '2026-09-30'),
      ('00000000-0000-0000-0000-000000000002', 'Centro Comercial Plaza Norte', 'Grupo Comercial SA', 'Mixco', 'comercial', 'ejecucion', 12500000, 14800000, 45, 52, 14.6133, -90.6064, '2025-11-01', '2026-12-15'),
      ('00000000-0000-0000-0000-000000000003', 'Planta Industrial Amatitlán', 'Manufacturas del Sur', 'Amatitlán', 'industrial', 'ejecucion', 8900000, 10200000, 30, 38, 14.4769, -90.6164, '2026-02-10', '2026-11-20'),
      ('00000000-0000-0000-0000-000000000004', 'Puente Vehicular Río Las Vacas', 'Municipalidad', 'Chinautla', 'civil', 'ejecucion', 6200000, 7100000, 78, 72, 14.6850, -90.5000, '2025-09-01', '2026-07-30'),
      ('00000000-0000-0000-0000-000000000005', 'Escuela Pública Zona 18', 'MINEDUC', 'Guatemala Z.18', 'publica', 'ejecucion', 3100000, 3450000, 88, 85, 14.6700, -90.4800, '2025-08-15', '2026-06-30'),
      ('00000000-0000-0000-0000-000000000006', 'Condominio Villas del Lago', 'Desarrolladora Lago', 'Santa Catarina Pinula', 'residencial', 'planeacion', 9500000, 11200000, 0, 5, 14.5700, -90.4960, '2026-07-01', '2027-08-30'),
      ('00000000-0000-0000-0000-000000000007', 'Bodega Logística CA-9', 'Transportes Unidos', 'Villa Nueva', 'industrial', 'planeacion', 5400000, 6100000, 0, 0, 14.5260, -90.5870, '2026-08-15', '2027-05-30'),
      ('00000000-0000-0000-0000-000000000008', 'Remodelación Edificio Centro', 'Banco Regional', 'Guatemala Z.1', 'comercial', 'planeacion', 2800000, 3300000, 0, 8, 14.6420, -90.5130, '2026-06-20', '2026-12-20');
  END IF;
END $$;

-- ============================================================
-- PARTE 3: SEED DATA — MOVIMIENTOS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_movimientos LIMIT 1) THEN
    INSERT INTO erp_movimientos (id, tipo, proyecto_id, descripcion, cantidad, unidad, categoria, costo_unitario, costo_total, fecha) VALUES
      ('00000000-0000-0000-0000-000000000011', 'ingreso', '00000000-0000-0000-0000-000000000001', 'Estimación #3 cobrada', 1, 'global', 'aporte', 980000, 980000, '2026-05-10'),
      ('00000000-0000-0000-0000-000000000012', 'gasto', '00000000-0000-0000-0000-000000000001', 'Compra de cemento', 850, 'saco', 'materiales', 92, 78200, '2026-05-12'),
      ('00000000-0000-0000-0000-000000000013', 'gasto', '00000000-0000-0000-0000-000000000002', 'Planilla semanal', 1, 'global', 'mano_obra', 145000, 145000, '2026-05-15'),
      ('00000000-0000-0000-0000-000000000014', 'ingreso', '00000000-0000-0000-0000-000000000004', 'Valuación municipal', 1, 'global', 'aporte', 620000, 620000, '2026-05-18'),
      ('00000000-0000-0000-0000-000000000015', 'gasto', NULL, 'Renta de oficina', 1, 'mes', 'fijos', 12000, 12000, '2026-05-01'),
      ('00000000-0000-0000-0000-000000000016', 'gasto', NULL, 'Gastos personales hogar', 1, 'mes', 'hogar', 8500, 8500, '2026-05-02'),
      ('00000000-0000-0000-0000-000000000017', 'gasto', '00000000-0000-0000-0000-000000000003', 'Subcontrato estructura metálica', 1, 'global', 'sub_contrato', 320000, 320000, '2026-05-20'),
      ('00000000-0000-0000-0000-000000000018', 'gasto', NULL, 'Combustible flotilla', 1, 'mes', 'transporte', 9800, 9800, '2026-05-08');
  END IF;
END $$;

-- ============================================================
-- PARTE 4: SEED DATA — EMPLEADOS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_empleados LIMIT 1) THEN
    INSERT INTO erp_empleados (id, nombre, puesto, proyecto_id, salario_diario, dias_trabajados, tipo) VALUES
      ('00000000-0000-0000-0000-000000000021', 'Carlos Méndez', 'Maestro de obra', '00000000-0000-0000-0000-000000000001', 175, 26, 'planilla'),
      ('00000000-0000-0000-0000-000000000022', 'José Ramírez', 'Albañil', '00000000-0000-0000-0000-000000000001', 130, 24, 'destajo'),
      ('00000000-0000-0000-0000-000000000023', 'Luis García', 'Armador', '00000000-0000-0000-0000-000000000002', 140, 25, 'planilla'),
      ('00000000-0000-0000-0000-000000000024', 'Ana López', 'Ing. Residente', '00000000-0000-0000-0000-000000000003', 380, 26, 'planilla'),
      ('00000000-0000-0000-0000-000000000025', 'Pedro Cux', 'Ayudante', '00000000-0000-0000-0000-000000000004', 95, 23, 'destajo'),
      ('00000000-0000-0000-0000-000000000026', 'Marvin Tzoc', 'Operador', '00000000-0000-0000-0000-000000000002', 165, 26, 'planilla'),
      ('00000000-0000-0000-0000-000000000027', 'Sandra Pérez', 'Bodeguero', '00000000-0000-0000-0000-000000000001', 120, 26, 'planilla');
  END IF;
END $$;

-- ============================================================
-- PARTE 5: SEED DATA — MATERIALES
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_materiales LIMIT 1) THEN
    INSERT INTO erp_materiales (id, nombre, unidad, stock, stock_minimo, precio, critico) VALUES
      ('00000000-0000-0000-0000-000000000031', 'Cemento UGC 42.5 kg', 'saco', 120, 200, 92, true),
      ('00000000-0000-0000-0000-000000000032', 'Hierro 3/8" grado 40', 'qq', 45, 60, 285, true),
      ('00000000-0000-0000-0000-000000000033', 'Block 0.15x0.20x0.40', 'u', 3200, 1500, 5.5, false),
      ('00000000-0000-0000-0000-000000000034', 'Arena de río', 'm³', 18, 10, 145, false),
      ('00000000-0000-0000-0000-000000000035', 'Piedrín 3/4"', 'm³', 8, 12, 195, true),
      ('00000000-0000-0000-0000-000000000036', 'Cal hidratada', 'saco', 60, 40, 48, false),
      ('00000000-0000-0000-0000-000000000037', 'Alambre de amarre', 'qq', 6, 5, 320, false),
      ('00000000-0000-0000-0000-000000000038', 'Lámina galvanizada cal.28', 'u', 25, 30, 165, true);
  END IF;
END $$;

-- ============================================================
-- PARTE 6: SEED DATA — ÓRDENES DE COMPRA
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_ordenes_compra LIMIT 1) THEN
    INSERT INTO erp_ordenes_compra (id, proveedor, material, cantidad, monto, estado, fecha) VALUES
      ('00000000-0000-0000-0000-000000000041', 'Cementos Progreso', 'Cemento UGC', 300, 27600, 'pendiente', '2026-05-28'),
      ('00000000-0000-0000-0000-000000000042', 'Aceros de Guatemala', 'Hierro 3/8"', 50, 14250, 'pendiente', '2026-05-29'),
      ('00000000-0000-0000-0000-000000000043', 'Agregados del Sur', 'Piedrín 3/4"', 20, 3900, 'aprobado', '2026-05-25'),
      ('00000000-0000-0000-0000-000000000044', 'Distribuidora Láminas', 'Lámina cal.28', 40, 6600, 'pendiente', '2026-05-30');
  END IF;
END $$;

-- ============================================================
-- PARTE 7: SEED DATA — PROVEEDORES
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_proveedores LIMIT 1) THEN
    INSERT INTO erp_proveedores (id, nombre, contacto, rubro, calificacion) VALUES
      ('00000000-0000-0000-0000-000000000051', 'Cementos Progreso', '2222-3344', 'Cemento y agregados', 5),
      ('00000000-0000-0000-0000-000000000052', 'Aceros de Guatemala', '2255-6677', 'Acero estructural', 4),
      ('00000000-0000-0000-0000-000000000053', 'Agregados del Sur', '2266-7788', 'Arena y piedrín', 4),
      ('00000000-0000-0000-0000-000000000054', 'Distribuidora Láminas', '2277-8899', 'Techos y láminas', 3),
      ('00000000-0000-0000-0000-000000000055', 'Ferretería Central', '2288-9900', 'Ferretería general', 5);
  END IF;
END $$;

-- ============================================================
-- PARTE 8: SEED DATA — INSUMOS BASE (24 registros)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_insumos_base LIMIT 1) THEN
    INSERT INTO erp_insumos_base (id, nombre, categoria, unidad, precio_referencia, rubro) VALUES
      ('00000000-0000-0000-0000-000000000061', 'Cemento UGC 42.5 kg', 'material', 'saco', 92, 'concreto'),
      ('00000000-0000-0000-0000-000000000062', 'Arena de río', 'material', 'm³', 145, 'concreto'),
      ('00000000-0000-0000-0000-000000000063', 'Piedrín 3/4"', 'material', 'm³', 195, 'concreto'),
      ('00000000-0000-0000-0000-000000000064', 'Hierro 3/8" grado 40', 'material', 'qq', 285, 'acero'),
      ('00000000-0000-0000-0000-000000000065', 'Hierro 1/2" grado 40', 'material', 'qq', 275, 'acero'),
      ('00000000-0000-0000-0000-000000000066', 'Alambre de amarre', 'material', 'qq', 320, 'acero'),
      ('00000000-0000-0000-0000-000000000067', 'Block 0.15x0.20x0.40', 'material', 'u', 5.5, 'mamposteria'),
      ('00000000-0000-0000-0000-000000000068', 'Block 0.20x0.20x0.40', 'material', 'u', 7.5, 'mamposteria'),
      ('00000000-0000-0000-0000-000000000069', 'Cal hidratada', 'material', 'saco', 48, 'mamposteria'),
      ('00000000-0000-0000-0000-00000000006a', 'Lámina galvanizada cal.28', 'material', 'u', 165, 'techos'),
      ('00000000-0000-0000-0000-00000000006b', 'Tubo PVC 1/2"', 'material', 'u', 38, 'instalaciones'),
      ('00000000-0000-0000-0000-00000000006c', 'Cable THW #12', 'material', 'm', 4.5, 'instalaciones'),
      ('00000000-0000-0000-0000-00000000006d', 'Piso cerámico 45x45', 'material', 'm²', 135, 'acabados'),
      ('00000000-0000-0000-0000-00000000006e', 'Pintura vinílica', 'material', 'galon', 120, 'acabados'),
      ('00000000-0000-0000-0000-00000000006f', 'Madera pino para formaleta', 'material', 'pt', 8.5, 'encofrado'),
      ('00000000-0000-0000-0000-000000000070', 'Albañil', 'mano_obra', 'jornal', 150, 'general'),
      ('00000000-0000-0000-0000-000000000071', 'Ayudante', 'mano_obra', 'jornal', 100, 'general'),
      ('00000000-0000-0000-0000-000000000072', 'Armador de acero', 'mano_obra', 'jornal', 160, 'acero'),
      ('00000000-0000-0000-0000-000000000073', 'Carpintero de formaleta', 'mano_obra', 'jornal', 155, 'encofrado'),
      ('00000000-0000-0000-0000-000000000074', 'Electricista', 'mano_obra', 'jornal', 175, 'instalaciones'),
      ('00000000-0000-0000-0000-000000000075', 'Vibrador de concreto', 'equipo', 'hora', 35, 'concreto'),
      ('00000000-0000-0000-0000-000000000076', 'Mezcladora de concreto', 'equipo', 'hora', 45, 'concreto'),
      ('00000000-0000-0000-0000-000000000077', 'Compactador', 'equipo', 'hora', 40, 'movimiento_tierras'),
      ('00000000-0000-0000-0000-000000000078', 'Andamio metálico', 'equipo', 'hora', 8, 'general');
  END IF;
END $$;

-- ============================================================
-- PARTE 9: SEED DATA — RENDIMIENTOS DE CUADRILLA (15 registros)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM erp_rendimientos_cuadrilla LIMIT 1) THEN
    INSERT INTO erp_rendimientos_cuadrilla (id, actividad, cuadrilla, rendimiento_diario, unidad) VALUES
      ('00000000-0000-0000-0000-000000000081', 'Excavación de cimientos', '1 Ayudante', 6, 'm³'),
      ('00000000-0000-0000-0000-000000000082', 'Concreto en cimientos', '2 Albañiles + 2 Ayudantes', 3, 'm³'),
      ('00000000-0000-0000-0000-000000000083', 'Concreto en columnas', '2 Albañiles + 2 Ayudantes', 1.5, 'm³'),
      ('00000000-0000-0000-0000-000000000084', 'Concreto en losas', '3 Albañiles + 3 Ayudantes', 8, 'm²'),
      ('00000000-0000-0000-0000-000000000085', 'Muro block 0.15', '1 Albañil + 1 Ayudante', 14, 'm²'),
      ('00000000-0000-0000-0000-000000000086', 'Muro block 0.20', '1 Albañil + 1 Ayudante', 11, 'm²'),
      ('00000000-0000-0000-0000-000000000087', 'Repello de muros', '1 Albañil + 1 Ayudante', 22, 'm²'),
      ('00000000-0000-0000-0000-000000000088', 'Cernido fino', '1 Albañil + 1 Ayudante', 25, 'm²'),
      ('00000000-0000-0000-0000-000000000089', 'Piso cerámico', '1 Albañil + 1 Ayudante', 16, 'm²'),
      ('00000000-0000-0000-0000-00000000008a', 'Pintura interior', '1 Albañil + 1 Ayudante', 40, 'm²'),
      ('00000000-0000-0000-0000-00000000008b', 'Acero de refuerzo', '1 Armador + 1 Ayudante', 200, 'kg'),
      ('00000000-0000-0000-0000-00000000008c', 'Instalación eléctrica', '1 Electricista + 1 Ayudante', 10, 'pto'),
      ('00000000-0000-0000-0000-00000000008d', 'Instalación agua potable', '1 Albañil + 1 Ayudante', 8, 'pto'),
      ('00000000-0000-0000-0000-00000000008e', 'Estructura metálica', '2 Armadores + 1 Ayudante', 120, 'kg'),
      ('00000000-0000-0000-0000-00000000008f', 'Encofrado de losa', '1 Carpintero + 1 Ayudante', 12, 'm²');
  END IF;
END $$;