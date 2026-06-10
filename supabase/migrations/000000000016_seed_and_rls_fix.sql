-- ============================================
-- MIGRACIÓN 016: FIX RLS + COLUMNAS FALTANTES + SEED
-- Fecha: 2026-09-06
-- ============================================

-- 1. Agregar columnas faltantes en erp_materiales
ALTER TABLE public.erp_materiales 
ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'general';

-- 2. Agregar columnas faltantes en erp_empleados  
ALTER TABLE public.erp_empleados 
ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true;

-- 3. Agregar columna faltante en erp_empleados
ALTER TABLE public.erp_empleados 
ADD COLUMN IF NOT EXISTS telefono text;

ALTER TABLE public.erp_empleados 
ADD COLUMN IF NOT EXISTS dias_trabajados int4 DEFAULT 0;

-- 4. Agregar columnas faltantes en erp_avances
ALTER TABLE public.erp_avances 
ADD COLUMN IF NOT EXISTS notas text;

-- 5. Agregar columnas faltantes en erp_proyectos
ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS descripcion text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS tipo_obra text DEFAULT 'nueva';

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS cliente_nit text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS cliente_telefono text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS cliente_email text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS direccion text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS ciudad text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS departamento text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS pais text DEFAULT 'Guatemala';

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS codigo_postal text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS area_construccion numeric;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS num_pisos int4;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS plazo_semanas int4;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS ingeniero_residente text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS supervisor text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS arquitecto text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS numero_expediente text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS numero_licencia text;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS margen_utilidad_objetivo numeric;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'GTQ';

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS etapa text DEFAULT 'planificacion';

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS fecha_inicio_real date;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS fecha_fin_estimada date;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS presupuesto_actual_id uuid;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS factor_sobrecosto jsonb;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS lat float8;

ALTER TABLE public.erp_proyectos 
ADD COLUMN IF NOT EXISTS lng float8;

-- 6. Hacer nullable usuario_nombre en logs_sistema (los triggers fallan con anon)
ALTER TABLE public.logs_sistema ALTER COLUMN usuario_nombre DROP NOT NULL;

-- 7. Agregar columnas faltantes en erp_movimientos
ALTER TABLE public.erp_movimientos 
ADD COLUMN IF NOT EXISTS proveedor text;

ALTER TABLE public.erp_movimientos 
ADD COLUMN IF NOT EXISTS notas text;

ALTER TABLE public.erp_movimientos 
ADD COLUMN IF NOT EXISTS proveedor_nit text;

ALTER TABLE public.erp_movimientos 
ADD COLUMN IF NOT EXISTS forma_pago text;

ALTER TABLE public.erp_movimientos 
ADD COLUMN IF NOT EXISTS referencia_bancaria text;

ALTER TABLE public.erp_movimientos 
ADD COLUMN IF NOT EXISTS retencion_isr numeric;

ALTER TABLE public.erp_movimientos 
ADD COLUMN IF NOT EXISTS retencion_iva numeric;

ALTER TABLE public.erp_movimientos 
ADD COLUMN IF NOT EXISTS factura text;

-- 8. Habilitar RLS con políticas permisivas para testing
ALTER TABLE public.erp_proyectos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_proyectos" ON public.erp_proyectos;
CREATE POLICY "allow_all_proyectos" ON public.erp_proyectos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_movimientos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_movimientos" ON public.erp_movimientos;
CREATE POLICY "allow_all_movimientos" ON public.erp_movimientos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_avances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_avances" ON public.erp_avances;
CREATE POLICY "allow_all_avances" ON public.erp_avances FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_empleados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_empleados" ON public.erp_empleados;
CREATE POLICY "allow_all_empleados" ON public.erp_empleados FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_materiales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_materiales" ON public.erp_materiales;
CREATE POLICY "allow_all_materiales" ON public.erp_materiales FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_presupuestos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_presupuestos" ON public.erp_presupuestos;
CREATE POLICY "allow_all_presupuestos" ON public.erp_presupuestos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_ordenes_compra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ordenes" ON public.erp_ordenes_compra;
CREATE POLICY "allow_all_ordenes" ON public.erp_ordenes_compra FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_proveedores" ON public.erp_proveedores;
CREATE POLICY "allow_all_proveedores" ON public.erp_proveedores FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_cuentas_cobrar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_cc" ON public.erp_cuentas_cobrar;
CREATE POLICY "allow_all_cc" ON public.erp_cuentas_cobrar FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_cuentas_pagar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_cp" ON public.erp_cuentas_pagar;
CREATE POLICY "allow_all_cp" ON public.erp_cuentas_pagar FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_ordenes_cambio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_oc" ON public.erp_ordenes_cambio;
CREATE POLICY "allow_all_oc" ON public.erp_ordenes_cambio FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_hitos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_hitos" ON public.erp_hitos;
CREATE POLICY "allow_all_hitos" ON public.erp_hitos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_riesgos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_riesgos" ON public.erp_riesgos;
CREATE POLICY "allow_all_riesgos" ON public.erp_riesgos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_licitaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_licitaciones" ON public.erp_licitaciones;
CREATE POLICY "allow_all_licitaciones" ON public.erp_licitaciones FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_cotizaciones_negocio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_cotizaciones" ON public.erp_cotizaciones_negocio;
CREATE POLICY "allow_all_cotizaciones" ON public.erp_cotizaciones_negocio FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.erp_notificaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_notificaciones" ON public.erp_notificaciones;
CREATE POLICY "allow_all_notificaciones" ON public.erp_notificaciones FOR ALL USING (true) WITH CHECK (true);

-- erp_publicaciones_muro es una VISTA, no se le puede habilitar RLS

ALTER TABLE public.erp_vales_salida ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_vales" ON public.erp_vales_salida;
CREATE POLICY "allow_all_vales" ON public.erp_vales_salida FOR ALL USING (true) WITH CHECK (true);

-- 9. Seed de datos demo
INSERT INTO public.erp_proyectos (id, nombre, cliente, ubicacion, tipologia, estado, presupuesto_total, monto_contrato, avance_fisico, avance_financiero, fecha_inicio, fecha_fin, descripcion, tipo_obra, pais)
VALUES 
  ('a1000000-0000-0000-0000-000000000001', 'Residencial Altamira', 'Inmobiliaria GT S.A.', 'Zona 14, Ciudad de Guatemala', 'residencial', 'ejecucion', 4500000, 4950000, 62, 58, '2025-01-01', '2025-12-31', 'Conjunto habitacional 48 viviendas', 'nueva', 'Guatemala'),
  ('a1000000-0000-0000-0000-000000000002', 'Centro Comercial Plaza Norte', 'Grupo Plaza S.A.', 'Zona 17, Guatemala', 'comercial', 'ejecucion', 8200000, 9020000, 78, 82, '2024-06-01', '2025-09-30', 'Remodelación y ampliación', 'remodelacion', 'Guatemala'),
  ('a1000000-0000-0000-0000-000000000003', 'Puente Los Cipreses', 'Municipalidad de San Lucas', 'San Lucas Sacatepéquez', 'civil', 'ejecucion', 2800000, 3080000, 35, 30, '2025-03-01', '2026-03-31', 'Puente vehicular de 120m', 'nueva', 'Guatemala'),
  ('a1000000-0000-0000-0000-000000000004', 'Planta Tratamiento Aguas', 'EMPAGUA', 'Mixco, Guatemala', 'industrial', 'ejecucion', 12000000, 13200000, 18, 20, '2025-06-01', '2026-06-30', 'PTAR Municipal', 'nueva', 'Guatemala'),
  ('a1000000-0000-0000-0000-000000000005', 'Colonia San José Etapa III', 'FHAV', 'Villa Nueva, Guatemala', 'residencial', 'ejecucion', 1800000, 1980000, 8, 5, '2025-08-01', '2026-02-28', 'Vivienda de interés social', 'nueva', 'Guatemala'),
  ('a1000000-0000-0000-0000-000000000006', 'Edificio Corporativo Torre Sur', 'Grupo Financiero GT', 'Zona 10, Ciudad de Guatemala', 'comercial', 'ejecucion', 15000000, 16500000, 90, 88, '2024-09-01', '2025-12-31', 'Oficinas corporativas 8 niveles', 'nueva', 'Guatemala')
ON CONFLICT (id) DO NOTHING;

-- Seed de movimientos
INSERT INTO public.erp_movimientos (id, tipo, proyecto_id, descripcion, cantidad, unidad, categoria, costo_unitario, costo_total, fecha)
VALUES 
  ('b1000000-0000-0000-0000-000000000001', 'ingreso', 'a1000000-0000-0000-0000-000000000001', 'Estimación 1 - Altamira', 1, 'servicio', 'administrativo', 412500, 412500, '2025-01-15'),
  ('b1000000-0000-0000-0000-000000000002', 'ingreso', 'a1000000-0000-0000-0000-000000000001', 'Estimación 2 - Altamira', 1, 'servicio', 'administrativo', 412500, 412500, '2025-02-15'),
  ('b1000000-0000-0000-0000-000000000003', 'ingreso', 'a1000000-0000-0000-0000-000000000001', 'Estimación 3 - Altamira', 1, 'servicio', 'administrativo', 412500, 412500, '2025-03-15'),
  ('b1000000-0000-0000-0000-000000000004', 'ingreso', 'a1000000-0000-0000-0000-000000000002', 'Estimación 1 - Plaza Norte', 1, 'servicio', 'administrativo', 751667, 751667, '2024-07-15'),
  ('b1000000-0000-0000-0000-000000000005', 'ingreso', 'a1000000-0000-0000-0000-000000000002', 'Estimación 2 - Plaza Norte', 1, 'servicio', 'administrativo', 751667, 751667, '2024-08-15'),
  ('b1000000-0000-0000-0000-000000000006', 'gasto', 'a1000000-0000-0000-0000-000000000001', 'Compra cemento', 200, 'saco', 'materiales', 89.5, 17900, '2025-01-10'),
  ('b1000000-0000-0000-0000-000000000007', 'gasto', 'a1000000-0000-0000-0000-000000000001', 'Compra varilla #4', 50, 'qq', 'materiales', 425, 21250, '2025-01-20'),
  ('b1000000-0000-0000-0000-000000000008', 'gasto', 'a1000000-0000-0000-0000-000000000001', 'Mano de obra albañiles', 1, 'mes', 'mano_obra', 45000, 45000, '2025-01-31'),
  ('b1000000-0000-0000-0000-000000000009', 'gasto', 'a1000000-0000-0000-0000-000000000002', 'Compra block', 5000, 'unidad', 'materiales', 6.5, 32500, '2024-07-10'),
  ('b1000000-0000-0000-0000-000000000010', 'gasto', 'a1000000-0000-0000-0000-000000000003', 'Excavación terreno', 1, 'servicio', 'herramienta', 85000, 85000, '2025-03-15')
ON CONFLICT (id) DO NOTHING;

-- Seed de empleados
INSERT INTO public.erp_empleados (id, nombre, puesto, salario_diario, tipo, activo, proyecto_id)
VALUES 
  ('c1000000-0000-0000-0000-000000000001', 'Juan Pérez López', 'Albañil', 150, 'planilla', true, 'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000002', 'Pedro García Ruiz', 'Oficial', 180, 'planilla', true, 'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000003', 'Carlos Martínez Gómez', 'Maestro de obra', 250, 'planilla', true, 'a1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000004', 'Ana Santizo Morales', 'Ayudante', 100, 'destajo', true, 'a1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000005', 'Francisco Rivas Santos', 'Soldador', 220, 'planilla', true, 'a1000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- Seed de materiales
INSERT INTO public.erp_materiales (id, nombre, unidad, stock, stock_minimo, precio, critico, categoria)
VALUES 
  ('d1000000-0000-0000-0000-000000000001', 'Cemento UGC Tolteca 42.5kg', 'saco', 850, 200, 89.5, false, 'materiales'),
  ('d1000000-0000-0000-0000-000000000002', 'Varilla corrugada #4', 'qq', 320, 100, 425, false, 'materiales'),
  ('d1000000-0000-0000-0000-000000000003', 'Arena de río', 'm³', 180, 40, 185, false, 'materiales'),
  ('d1000000-0000-0000-0000-000000000004', 'Block 14x19x39', 'unidad', 4500, 1000, 6.5, false, 'materiales')
ON CONFLICT (id) DO NOTHING;

-- Seed de presupuestos
INSERT INTO public.erp_presupuestos (id, proyecto_id, tipologia, renglones, total_calculado, costo_directo_total, estado, version_presupuesto, fecha_creacion, fecha_actualizacion)
VALUES 
  ('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'residencial', '[]', 4500000, 3015000, 'aprobado', 1, '2024-12-01T00:00:00Z', '2024-12-01T00:00:00Z'),
  ('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'comercial', '[]', 8200000, 5494000, 'aprobado', 1, '2024-05-01T00:00:00Z', '2024-05-01T00:00:00Z'),
  ('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'civil', '[]', 2800000, 1876000, 'aprobado', 1, '2025-02-01T00:00:00Z', '2025-02-01T00:00:00Z'),
  ('e1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'industrial', '[]', 12000000, 8040000, 'aprobado', 1, '2025-05-01T00:00:00Z', '2025-05-01T00:00:00Z'),
  ('e1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'residencial', '[]', 1800000, 1206000, 'borrador', 1, '2025-07-01T00:00:00Z', '2025-07-01T00:00:00Z'),
  ('e1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'comercial', '[]', 15000000, 10050000, 'aprobado', 1, '2024-08-01T00:00:00Z', '2024-08-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Seed de avances
INSERT INTO public.erp_avances (id, proyecto_id, fecha, avance_fisico, cantidad_ejecutada)
VALUES 
  ('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '2025-01-31', 8, 307),
  ('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', '2025-02-28', 18, 691),
  ('f1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', '2025-03-31', 32, 1229),
  ('f1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', '2025-04-30', 45, 1728),
  ('f1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', '2025-05-31', 55, 2112),
  ('f1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', '2025-06-30', 62, 2381),
  ('f100000a-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000002', '2024-07-31', 12, 1500),
  ('f100000a-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000002', '2024-08-31', 28, 3500),
  ('f100000a-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000002', '2024-09-30', 42, 5250),
  ('f100000a-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000002', '2024-10-31', 55, 6875),
  ('f100000a-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000002', '2024-11-30', 65, 8125),
  ('f100000a-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000002', '2024-12-31', 78, 9750)
ON CONFLICT (id) DO NOTHING;

-- Seed de órdenes de compra
INSERT INTO public.erp_ordenes_compra (id, proveedor, material, cantidad, monto, estado, fecha, proyecto_id)
VALUES 
  ('61000000-0000-0000-0000-000000000001', 'Cemento Progreso S.A.', 'Cemento UGC Tolteca 42.5kg', 200, 17900, 'aprobado', '2025-01-10', 'a1000000-0000-0000-0000-000000000001'),
  ('61000000-0000-0000-0000-000000000002', 'Ferretería Industrial GT', 'Varilla corrugada #4', 80, 34000, 'recibida', '2024-07-10', 'a1000000-0000-0000-0000-000000000002'),
  ('61000000-0000-0000-0000-000000000003', 'Distribuidora de Hierro S.A.', 'Hierro liso 1/4"', 30, 11400, 'pendiente', '2025-01-15', 'a1000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Seed de proveedores
INSERT INTO public.erp_proveedores (id, nombre, contacto, telefono, email, categoria, calificacion)
VALUES 
  ('71000000-0000-0000-0000-000000000001', 'Cemento Progreso S.A.', 'Carlos Soto', '2245-7890', 'ventas@cempro.gt', 'materiales', 4),
  ('71000000-0000-0000-0000-000000000002', 'Ferretería Industrial GT', 'Luis Fernández', '2233-4567', 'lfernandez@ferrera.gt', 'materiales', 5),
  ('71000000-0000-0000-0000-000000000003', 'Distribuidora de Hierro S.A.', 'Ana María Rivas', '2288-9012', 'ventas@dihierro.gt', 'materiales', 4)
ON CONFLICT (id) DO NOTHING;