-- SEED REALISTA PARA PRUEBAS E2E CONSTRUSMART
-- Ejecutar en Supabase SQL Editor

-- 0. Usuario administrador conocido
-- salazaroliveros@gmail.com (ya existe en auth.users)

-- 1. PROYECTOS (datos para dashboard/gráficas)
INSERT INTO public.erp_proyectos (id, nombre, cliente, ubicacion, tipologia, estado, presupuesto_total, monto_contrato, avance_fisico, avance_financiero, lat, lng, fecha_inicio, fecha_fin, created_by, created_at, updated_at)
VALUES
('a1b2c3d4-1111-4111-8111-111111111111', 'Torre Orion', 'Inversiones del Norte', 'Zona 10', 'comercial', 'ejecucion', 12500000, 14200000, 42, 45, 14.603, -90.489, '2025-01-15', '2026-06-30', '00000000-0000-0000-0000-000000000000', now(), now()),
('b2c3d4e1-2222-4222-8222-222222222222', 'Residencial Los Olivos', 'Grupo Habitat', 'Carretera a El Salvador km 12', 'residencial', 'ejecucion', 8700000, 9500000, 28, 30, 14.551, -90.429, '2025-03-01', '2026-02-28', '00000000-0000-0000-0000-000000000000', now(), now()),
('c3d4e1f2-3333-4333-8333-333333333333', 'Planta Industrial beta', 'Agroindustrias del Sur', 'Puerto Barrios', 'industrial', 'pausado', 21000000, 0, 12, 10, 15.301, -88.593, '2025-05-01', '2027-01-15', '00000000-0000-0000-0000-000000000000', now(), now());

-- 2. MOVIMIENTOS (ingresos/gastos para gráficas financieras)
INSERT INTO public.erp_movimientos (id, tipo, proyecto_id, descripcion, cantidad, unidad, categoria, costo_unitario, costo_total, fecha, created_by, created_at, updated_at)
VALUES
('d1e2f3a1-4444-4444-8444-444444444444', 'ingreso', 'a1b2c3d4-1111-4111-8111-111111111111', 'Anticipo cliente Torre Orion', 1, 'global', 'administracion', 8000000, 8000000, '2025-01-20', '00000000-0000-0000-0000-000000000000', now(), now()),
('e2f3a1b2-5555-5555-8555-555555555555', 'gasto', 'a1b2c3d4-1111-4111-8111-111111111111', 'Compra de cemento', 500, 'sacos', 'materiales', 120, 60000, '2025-01-22', '00000000-0000-0000-0000-000000000000', now(), now()),
('f3a1b2c3-6666-6666-8666-666666666666', 'gasto', 'a1b2c3d4-1111-4111-8111-111111111111', 'Planilla semana 3', 1, 'global', 'mano_obra', 340000, 340000, '2025-02-10', '00000000-0000-0000-0000-000000000000', now(), now()),
('a1b2c3d4-7777-7777-8777-777777777777', 'ingreso', 'b2c3d4e1-2222-4222-8222-222222222222', 'Anticipo residencial Los Olivos', 1, 'global', 'administracion', 4500000, 4500000, '2025-03-05', '00000000-0000-0000-0000-000000000000', now(), now()),
('b2c3d4e1-8888-8888-8888-888888888888', 'gasto', 'b2c3d4e1-2222-4222-8222-222222222222', 'Compra de acero de refuerzo', 1200, 'varillas', 'materiales', 95, 114000, '2025-03-06', '00000000-0000-0000-0000-000000000000', now(), now());

-- 3. PRESUPUESTOS (para módulo presupuestos y dashboard)
INSERT INTO public.erp_presupuestos (id, proyecto_id, tipologia, renglones, total_calculado, costo_directo_total, estado, notas, version_presupuesto, fecha_creacion, fecha_actualizacion, created_by, updated_by)
VALUES
('c1d2e3f4-9999-4999-8999-999999999999', 'a1b2c3d4-1111-4111-8111-111111111111', 'comercial', '[]'::jsonb, 12500000, 9500000, 'aprobado', 'Presupuesto base Torre Orion', 1, now(), now(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'),
('d1e2f3a4-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'b2c3d4e1-2222-4222-8222-222222222222', 'residencial', '[]'::jsonb, 8700000, 6400000, 'aprobado', 'Presupuesto base Los Olivos', 1, now(), now(), '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000');

-- 4. AVANCES (para curva S / seguiiento)
INSERT INTO public.erp_avances (id, proyecto_id, presupuesto_id, renglon_id, fecha, avance_fisico, cantidad_ejecutada, foto, latitud, longitud, created_by, created_at)
VALUES
('e1f2a3b4-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'a1b2c3d4-1111-4111-8111-111111111111', 'c1d2e3f4-9999-4999-8999-999999999999', null, '2025-02-01', 8, 800, null, null, null, '00000000-0000-0000-0000-000000000000', now()),
('f1a2b3c4-cccc-4ccc-8ccc-cccccccccccc', 'a1b2c3d4-1111-4111-8111-111111111111', 'c1d2e3f4-9999-4999-8999-999999999999', null, '2025-03-01', 18, 1800, null, null, null, '00000000-0000-0000-0000-000000000000', now()),
('a1b2c3d4-dddd-4ddd-8ddd-dddddddddddd', 'a1b2c3d4-1111-4111-8111-111111111111', 'c1d2e3f4-9999-4999-8999-999999999999', null, '2025-04-01', 28, 2800, null, null, null, '00000000-0000-0000-0000-000000000000', now()),
('b1c2d3e4-eeee-4eee-8eee-eeeeeeeeeeee', 'a1b2c3d4-1111-4111-8111-111111111111', 'c1d2e3f4-9999-4999-8999-999999999999', null, '2025-05-01', 36, 3600, null, null, null, '00000000-0000-0000-0000-000000000000', now()),
('c1d2e3f4-ffff-4fff-8fff-ffffffffffff', 'b2c3d4e1-2222-4222-8222-222222222222', 'd1e2f3a4-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, '2025-04-01', 10, 1200, null, null, null, '00000000-0000-0000-0000-000000000000', now());

-- 5. SEGUIMIENTO EVM (para curvas y proyecciones)
INSERT INTO public.erp_seguimiento_evm (id, proyecto_id, fecha, avance_fisico, avance_financiero, costo_planeado, costo_real, valor_planeado, valor_ganado, cv, sv, created_at)
VALUES
('11111111-1111-4111-8111-111111111111', 'a1b2c3d4-1111-4111-8111-111111111111', '2025-02-01', 8, 10, 900000, 850000, 1000000, 920000, 50000, 80000, now()),
('22222222-2222-4222-8222-222222222222', 'a1b2c3d4-1111-4111-8111-111111111111', '2025-03-01', 18, 22, 1800000, 1700000, 2000000, 1880000, 100000, 120000, now()),
('33333333-3333-4333-8333-333333333333', 'a1b2c3d4-1111-4111-8111-111111111111', '2025-04-01', 28, 30, 2700000, 2550000, 3000000, 2850000, 150000, 150000, now()),
('44444444-4444-4444-8444-444444444444', 'a1b2c3d4-1111-4111-8111-111111111111', '2025-05-01', 36, 38, 3600000, 3400000, 4000000, 3700000, 200000, 300000, now());

-- 6. EMPLEADOS (RRHH / dashboards)
INSERT INTO public.erp_empleados (id, nombre, puesto, proyecto_id, salario_diario, dias_trabajados, tipo, created_by, created_at, updated_at)
VALUES
('55555555-5555-5555-8555-555555555555', 'María López', 'Supervisora', 'a1b2c3d4-1111-4111-8111-111111111111', 450, 64, 'planilla', '00000000-0000-0000-0000-000000000000', now(), now()),
('66666666-6666-6666-8666-666666666666', 'Juan Pérez', 'Maestro de obra', 'a1b2c3d4-1111-4111-8111-111111111111', 380, 60, 'planilla', '00000000-0000-0000-0000-000000000000', now(), now()),
('77777777-7777-7777-8777-777777777777', ' Ana Gómez', 'Topógrafa', 'b2c3d4e1-2222-4222-8222-222222222222', 420, 48, 'planilla', '00000000-0000-0000-0000-000000000000', now(), now());

-- 7. BITÁCORA (bitácora diaria para dashboard y módulos)
INSERT INTO public.erp_bitacora (id, proyecto_id, fecha, clima, personal, maquinaria, tareas, observaciones, created_by, created_at, updated_at)
VALUES
('88888888-8888-8888-8888-888888888888', 'a1b2c3d4-1111-4111-8111-111111111111', '2025-04-02', 'Parcialmente nublado', 24, 'Retroexcavadora, Grúa', 'Colado de losa nivel 3', 'Sin novedades', '00000000-0000-0000-0000-000000000000', now(), now()),
('99999999-9999-9999-8999-999999999999', 'b2c3d4e1-2222-4222-8222-222222222222', '2025-04-02', 'Lluvioso', 12, 'Camión', 'Excavación para cimentación', 'Se detuvo 2 horas por lluvia', '00000000-0000-0000-0000-000000000000', now(), now());
