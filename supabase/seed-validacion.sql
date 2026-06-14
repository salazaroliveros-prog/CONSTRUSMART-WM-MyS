-- ============================================================
-- SEED DE VALIDACIÓN — CONSTRUSMART ERP
-- ============================================================
-- Propósito: Poblar Supabase con datos financieros y físicos
-- para verificar que todos los componentes visuales del ERP
-- reaccionan correctamente al ingreso de nuevos proyectos.
-- ============================================================

-- 1. PROYECTO BASE
INSERT INTO erp_proyectos (id, nombre, ubicacion, tipologia, presupuesto_total, monto_contrato, cliente, fecha_inicio, fecha_fin, avance_fisico, avance_financiero, estado, descripcion, tipo_obra, moneda, etapa)
VALUES
  ('proy-001', 'Edificio Torre Business Center', 'Zona 10, Ciudad de Guatemala', 'comercial', 8500000, 10500000, 'Grupo Empresarial XYZ', '2026-01-15', '2026-12-20', 45, 38, 'ejecucion', 'Construcción de torre de oficinas de 12 niveles', 'nueva', 'GTQ', 'construccion'),
  ('proy-002', 'Residencial Los Almendros', 'Mixco, Guatemala', 'residencial', 3200000, 3800000, 'Desarrollos Habitacionales SA', '2026-03-01', '2026-11-30', 60, 55, 'ejecucion', 'Urbanización de 45 viviendas unifamiliares', 'nueva', 'GTQ', 'construccion'),
  ('proy-003', 'Puente Vehicular Las Flores', 'Villa Nueva, Guatemala', 'civil', 5200000, 6200000, 'Municipalidad de Villa Nueva', '2026-02-01', '2026-10-15', 30, 25, 'ejecucion', 'Puente vehicular de 120m de longitud', 'nueva', 'GTQ', 'construccion'),
  ('proy-004', 'Ampliación Centro Comercial Metro', 'Zona 11, Guatemala', 'comercial', 12000000, 15000000, 'Grupo Metro SA', '2026-05-01', '2027-06-30', 15, 12, 'ejecucion', 'Ampliación de 3 niveles y parqueo subterráneo', 'ampliacion', 'GTQ', 'construccion'),
  ('proy-005', 'Planta Industrial Texaco', 'Amatitlán, Guatemala', 'industrial', 9800000, 11500000, 'Texaco Guatemala SA', '2026-04-01', '2027-03-31', 20, 18, 'ejecucion', 'Planta de procesamiento de 5000m2', 'nueva', 'GTQ', 'construccion');

-- 2. MATERIALES
INSERT INTO erp_materiales (id, nombre, unidad, precio, stock, stock_minimo, cantidad_presupuestada, proyecto_ids)
VALUES
  ('mat-001', 'Cemento Sol 42.5kg', 'saco', 85.00, 1500, 500, 5000, '{proy-001,proy-002,proy-003}'),
  ('mat-002', 'Varilla Corrugada #4', 'qq', 420.00, 800, 200, 2500, '{proy-001,proy-003,proy-005}'),
  ('mat-003', 'Block 15x20x40', 'unidad', 7.50, 12000, 3000, 35000, '{proy-001,proy-002}'),
  ('mat-004', 'Arena de Río', 'm3', 185.00, 300, 100, 800, '{proy-001,proy-002,proy-003,proy-004,proy-005}'),
  ('mat-005', 'Piedrín 3/4', 'm3', 210.00, 250, 80, 600, '{proy-001,proy-003,proy-005}'),
  ('mat-006', 'Hierro #3', 'qq', 380.00, 0, 100, 1800, '{proy-001,proy-004}'),
  ('mat-007', 'Cable THW #12', 'm', 4.50, 5000, 2000, 15000, '{proy-001,proy-004}'),
  ('mat-008', 'Tubería PVC 4 pulg', 'unidad', 35.00, 0, 50, 1200, '{proy-002,proy-004}'),
  ('mat-009', 'Pintura Vinílica Blanca', 'galón', 120.00, 45, 30, 200, '{proy-001,proy-002}'),
  ('mat-010', 'Cerámica 45x45', 'm2', 65.00, 0, 100, 2500, '{proy-002}');

-- 3. PRESUPUESTOS
INSERT INTO erp_presupuestos (id, proyecto_id, nombre, version, estado, costo_directo, total_presupuestado, total_calculado)
VALUES
  ('pres-001', 'proy-001', 'Presupuesto Torre Business Center', 1, 'aprobado', 5500000, 8500000, 8500000),
  ('pres-002', 'proy-002', 'Presupuesto Residencial Los Almendros', 1, 'aprobado', 2100000, 3200000, 3200000),
  ('pres-003', 'proy-003', 'Presupuesto Puente Las Flores', 1, 'aprobado', 3400000, 5200000, 5200000);

-- 4. MOVIMIENTOS FINANCIEROS
INSERT INTO erp_movimientos (id, proyecto_id, tipo, monto, categoria, descripcion, fecha)
VALUES
  ('mov-001', 'proy-001', 'ingreso', 2500000, 'anticipo', 'Anticipo 30% Torre Business Center', '2026-01-20'),
  ('mov-002', 'proy-001', 'gasto', 450000, 'materiales', 'Compra cemento + acero fase 1', '2026-02-05'),
  ('mov-003', 'proy-001', 'gasto', 120000, 'mano_obra', 'Nómina mensual enero', '2026-01-31'),
  ('mov-004', 'proy-001', 'gasto', 85000, 'equipo', 'Renta grúa torre mes 1', '2026-01-25'),
  ('mov-005', 'proy-001', 'gasto', 95000, 'subcontratos', 'Instalación eléctrica provisional', '2026-02-10'),
  ('mov-006', 'proy-001', 'ingreso', 1500000, 'estimacion', 'Estimación 1 - 30% avance', '2026-03-15'),
  ('mov-007', 'proy-001', 'gasto', 380000, 'materiales', 'Compra block + arena + piedrín', '2026-03-01'),
  ('mov-008', 'proy-002', 'ingreso', 1500000, 'anticipo', 'Anticipo 40% Residencial Los Almendros', '2026-03-05'),
  ('mov-009', 'proy-002', 'gasto', 280000, 'materiales', 'Materiales fase 1 urbanización', '2026-03-10'),
  ('mov-010', 'proy-002', 'gasto', 95000, 'mano_obra', 'Nómina marzo', '2026-03-31'),
  ('mov-011', 'proy-003', 'ingreso', 2000000, 'anticipo', 'Anticipo 32% Puente Las Flores', '2026-02-05'),
  ('mov-012', 'proy-003', 'gasto', 520000, 'materiales', 'Acero + concreto preliminar', '2026-02-15'),
  ('mov-013', 'proy-004', 'ingreso', 3500000, 'anticipo', 'Anticipo 25% Centro Comercial Metro', '2026-05-10'),
  ('mov-014', 'proy-004', 'gasto', 890000, 'materiales', 'Acero + concreto fase inicial', '2026-05-20'),
  ('mov-015', 'proy-005', 'ingreso', 2800000, 'anticipo', 'Anticipo 25% Planta Texaco', '2026-04-10'),
  ('mov-016', 'proy-005', 'gasto', 650000, 'materiales', 'Materiales iniciales planta', '2026-04-20');

-- 5. AVANCES FÍSICOS (mensuales)
INSERT INTO erp_avances (id, proyecto_id, fecha, avance_fisico, avance_financiero, responsable, notas)
VALUES
  ('ava-001', 'proy-001', '2026-01-31', 5, 4, 'Ing. Pérez', 'Cimentación - excavación'),
  ('ava-002', 'proy-001', '2026-02-28', 12, 10, 'Ing. Pérez', 'Cimentación - fundiciones'),
  ('ava-003', 'proy-001', '2026-03-31', 20, 17, 'Ing. Pérez', 'Estructura nivel 1-3'),
  ('ava-004', 'proy-001', '2026-04-30', 30, 25, 'Ing. Pérez', 'Estructura nivel 4-6'),
  ('ava-005', 'proy-001', '2026-05-31', 38, 32, 'Ing. Pérez', 'Estructura nivel 7-9'),
  ('ava-006', 'proy-001', '2026-06-30', 45, 38, 'Ing. Pérez', 'Estructura nivel 10-12'),
  ('ava-007', 'proy-002', '2026-03-31', 10, 8, 'Arq. López', 'Movimiento de tierras'),
  ('ava-008', 'proy-002', '2026-04-30', 25, 22, 'Arq. López', 'Fundiciones 15 viviendas'),
  ('ava-009', 'proy-002', '2026-05-31', 40, 36, 'Arq. López', 'Paredes 25 viviendas'),
  ('ava-010', 'proy-002', '2026-06-30', 60, 55, 'Arq. López', 'Techos 30 viviendas'),
  ('ava-011', 'proy-003', '2026-02-28', 8, 6, 'Ing. Ramírez', 'Excavación estribos'),
  ('ava-012', 'proy-003', '2026-03-31', 15, 12, 'Ing. Ramírez', 'Fundiciones estribos'),
  ('ava-013', 'proy-003', '2026-04-30', 22, 18, 'Ing. Ramírez', 'Columnas y vigas'),
  ('ava-014', 'proy-003', '2026-05-31', 30, 25, 'Ing. Ramírez', 'Tablero losa'),
  ('ava-015', 'proy-004', '2026-05-31', 5, 4, 'Ing. Morales', 'Demolición y preliminares'),
  ('ava-016', 'proy-004', '2026-06-30', 15, 12, 'Ing. Morales', 'Excavación parqueo'),
  ('ava-017', 'proy-005', '2026-04-30', 5, 4, 'Ing. Castillo', 'Preliminares planta'),
  ('ava-018', 'proy-005', '2026-05-31', 12, 10, 'Ing. Castillo', 'Cimentación planta'),
  ('ava-019', 'proy-005', '2026-06-30', 20, 18, 'Ing. Castillo', 'Estructura metálica');

-- 6. HITOS
INSERT INTO erp_hitos (id, proyecto_id, nombre, fecha, estado, responsable)
VALUES
  ('hito-001', 'proy-001', 'Inicio de obra', '2026-01-15', 'completado', 'Ing. Pérez'),
  ('hito-002', 'proy-001', 'Cimentación completa', '2026-03-01', 'completado', 'Ing. Pérez'),
  ('hito-003', 'proy-001', 'Estructura completa', '2026-08-15', 'pendiente', 'Ing. Pérez'),
  ('hito-004', 'proy-001', 'Instalaciones completas', '2026-10-01', 'pendiente', 'Ing. Pérez'),
  ('hito-005', 'proy-001', 'Entrega final', '2026-12-20', 'pendiente', 'Ing. Pérez'),
  ('hito-006', 'proy-002', 'Inicio de obra', '2026-03-01', 'completado', 'Arq. López'),
  ('hito-007', 'proy-002', 'Obra gris completa', '2026-09-01', 'pendiente', 'Arq. López'),
  ('hito-008', 'proy-002', 'Entrega final', '2026-11-30', 'pendiente', 'Arq. López'),
  ('hito-009', 'proy-003', 'Inicio de obra', '2026-02-01', 'completado', 'Ing. Ramírez'),
  ('hito-010', 'proy-003', 'Superestructura completa', '2026-08-01', 'pendiente', 'Ing. Ramírez'),
  ('hito-011', 'proy-003', 'Entrega final', '2026-10-15', 'pendiente', 'Ing. Ramírez');

-- 7. RIESGOS
INSERT INTO erp_riesgos (id, proyecto_id, nombre, nivel, estado, probabilidad, impacto, descripcion)
VALUES
  ('ries-001', 'proy-001', 'Retraso en entrega de acero', 'alto', 'abierto', 60, 'alto', 'Proveedor principal con problemas de inventario'),
  ('ries-002', 'proy-001', 'Incremento precio cemento', 'medio', 'abierto', 40, 'medio', 'Mercado internacional volátil'),
  ('ries-003', 'proy-002', 'Problemas de permisos', 'medio', 'abierto', 30, 'alto', 'Licencias municipales pendientes'),
  ('ries-004', 'proy-003', 'Condiciones climáticas', 'alto', 'abierto', 70, 'alto', 'Temporada de lluvias puede retrasar obra'),
  ('ries-005', 'proy-004', 'Disponibilidad de equipo', 'bajo', 'abierto', 20, 'medio', 'Grúa de gran tonelaje con alta demanda');

-- 8. LICITACIONES / CRM
INSERT INTO erp_licitaciones (id, nombre, cliente, monto, estado, probabilidad, fecha, notas)
VALUES
  ('lic-001', 'Edificio Municipal Amatitlán', 'Municipalidad de Amatitlán', 2500000, 'abierta', 75, '2026-07-01', 'Obra de 4 niveles con parqueo'),
  ('lic-002', 'Urbanización El Rosario', 'Grupo Inmobiliario GT', 5800000, 'en_proceso', 60, '2026-07-15', '120 viviendas de interés social'),
  ('lic-003', 'Planta Tratamiento Aguas', 'EMPAGUA', 9200000, 'abierta', 40, '2026-08-01', 'Planta de tratamiento 200 l/s'),
  ('lic-004', 'Centro Deportivo Sur', 'CDAG', 3800000, 'abierta', 50, '2026-07-20', 'Cancha techada + área recreativa'),
  ('lic-005', 'Remodelación Edificio Municipal Mixco', 'Municipalidad de Mixco', 1500000, 'ganada', 100, '2026-06-15', 'Remodelación fachada + interiores'),
  ('lic-006', 'Hospital Distrital Escuintla', 'MSPAS', 15000000, 'abierta', 30, '2026-09-01', 'Hospital 200 camas nivel 2');

-- 9. CUENTAS POR COBRAR
INSERT INTO erp_cuentas_cobrar (id, proyecto_id, cliente, monto, saldo_pendiente, fecha_vencimiento, estado, concepto)
VALUES
  ('cc-001', 'proy-001', 'Grupo Empresarial XYZ', 1500000, 500000, '2026-07-15', 'pendiente', 'Estimación 2 - Torre Business'),
  ('cc-002', 'proy-001', 'Grupo Empresarial XYZ', 2000000, 2000000, '2026-09-15', 'pendiente', 'Estimación 3 - Torre Business'),
  ('cc-003', 'proy-002', 'Desarrollos Habitacionales SA', 800000, 0, '2026-06-01', 'cobrado', 'Estimación 1 - Los Almendros'),
  ('cc-004', 'proy-002', 'Desarrollos Habitacionales SA', 900000, 900000, '2026-08-15', 'pendiente', 'Estimación 2 - Los Almendros'),
  ('cc-005', 'proy-003', 'Municipalidad de Villa Nueva', 1500000, 1500000, '2026-07-01', 'vencido', 'Estimación 1 - Puente Flores'),
  ('cc-006', 'proy-004', 'Grupo Metro SA', 3500000, 3500000, '2026-09-30', 'pendiente', 'Estimación 1 - CCMetro');

-- 10. CUENTAS POR PAGAR
INSERT INTO erp_cuentas_pagar (id, proyecto_id, proveedor, monto, saldo_pendiente, fecha_vencimiento, estado, concepto)
VALUES
  ('cp-001', 'proy-001', 'Cemento Progreso SA', 85000, 0, '2026-06-15', 'pagado', 'Cemento fase 1'),
  ('cp-002', 'proy-001', 'Aceros de Guatemala', 320000, 320000, '2026-07-20', 'pendiente', 'Varilla corrugada fase 2'),
  ('cp-003', 'proy-001', 'Constructora Equipos SA', 42000, 42000, '2026-07-10', 'pendiente', 'Renta grúa torre junio'),
  ('cp-004', 'proy-002', 'Materiales GT', 150000, 75000, '2026-07-05', 'pendiente', 'Block y cemento marzo'),
  ('cp-005', 'proy-003', 'Concretera Nacional', 280000, 280000, '2026-06-30', 'vencido', 'Concreto estribos'),
  ('cp-006', 'proy-004', 'Aceros de Guatemala', 500000, 500000, '2026-08-15', 'pendiente', 'Acero fase inicial');

-- 11. EMPLEADOS / RRHH
INSERT INTO erp_empleados (id, nombre, puesto, salario_diario, tipo, proyecto_id, dias_trabajados, estado)
VALUES
  ('emp-001', 'Juan Carlos Pérez', 'Ingeniero Residente', 550, 'planilla', 'proy-001', 22, 'ocupado'),
  ('emp-002', 'María José López', 'Arquitecta', 450, 'planilla', 'proy-002', 20, 'ocupado'),
  ('emp-003', 'Pedro Ramírez', 'Ingeniero Estructural', 500, 'planilla', 'proy-003', 22, 'ocupado'),
  ('emp-004', 'Ana Morales', 'Supervisora de Obra', 350, 'planilla', 'proy-004', 18, 'ocupado'),
  ('emp-005', 'Carlos Castillo', 'Ingeniero Civil', 480, 'planilla', 'proy-005', 22, 'ocupado'),
  ('emp-006', 'Luisa Fernández', 'Topógrafa', 300, 'planilla', null, 15, 'disponible'),
  ('emp-007', 'Roberto Vásquez', 'Albañil', 250, 'destajo', 'proy-001', 22, 'ocupado'),
  ('emp-008', 'José Hernández', 'Albañil', 250, 'destajo', 'proy-002', 20, 'ocupado'),
  ('emp-009', 'Miguel Álvarez', 'Electricista', 300, 'destajo', 'proy-001', 18, 'ocupado'),
  ('emp-010', 'Carlos Méndez', 'Soldador', 280, 'destajo', 'proy-003', 22, 'ocupado');

-- 12. ÓRDENES DE COMPRA
INSERT INTO erp_ordenes_compra (id, proveedor, material, cantidad, precio_unitario, estado, proyecto_id, fecha, items)
VALUES
  ('oc-001', 'Cemento Progreso SA', 'Cemento Sol 42.5kg', 500, 85, 'pendiente', 'proy-001', '2026-07-01', '[{"materialId":"mat-001","cantidad":500,"precio":85}]'),
  ('oc-002', 'Aceros de Guatemala', 'Varilla Corrugada #4', 200, 420, 'pendiente', 'proy-001', '2026-07-05', '[{"materialId":"mat-002","cantidad":200,"precio":420}]'),
  ('oc-003', 'Materiales GT', 'Block 15x20x40', 3000, 7.5, 'aprobado', 'proy-002', '2026-06-20', '[{"materialId":"mat-003","cantidad":3000,"precio":7.5}]'),
  ('oc-004', 'Concretera Nacional', 'Concreto Premezclado 3000psi', 100, 950, 'pendiente', 'proy-003', '2026-07-10', '[]');

-- 13. ORDENES DE CAMBIO
INSERT INTO erp_ordenes_cambio (id, proyecto_id, titulo, descripcion, impactoCosto, estado, fecha_solicitud)
VALUES
  ('ocam-001', 'proy-001', 'Cambio en diseño fachada', 'El cliente solicitó fachada de vidrio templado en lugar de aluminio', 250000, 'aprobado', '2026-04-15'),
  ('ocam-002', 'proy-001', 'Ampliación parqueo', 'Se agregaron 20 parqueos subterráneos adicionales', 350000, 'solicitud', '2026-05-20'),
  ('ocam-003', 'proy-002', 'Mejora acabados', 'Cambio de cerámica estándar a porcelanato en áreas comunes', 85000, 'revision', '2026-06-01'),
  ('ocam-004', 'proy-003', 'Refuerzo estructural', 'Se requiere acero adicional por estudio de suelos actualizado', 180000, 'aprobado', '2026-04-10');

-- 14. SEGUIMIENTO EVM
INSERT INTO erp_seguimiento (id, proyecto_id, fecha, pv, ev, ac, cpi, spi)
VALUES
  ('evm-001', 'proy-001', '2026-06-30', 3800000, 3825000, 3600000, 1.06, 1.01),
  ('evm-002', 'proy-002', '2026-06-30', 1760000, 1920000, 1680000, 1.14, 1.09),
  ('evm-003', 'proy-003', '2026-06-30', 1560000, 1300000, 1440000, 0.90, 0.83);

-- 15. INCIDENTES / SSO
INSERT INTO erp_incidentes (id, proyecto_id, tipo, descripcion, fecha, gravedad, estado, reportado_por)
VALUES
  ('inc-001', 'proy-001', 'accidente', 'Caída desde andamio a 2m - lesión menor', '2026-03-15', 'leve', 'cerrado', 'Ing. Pérez'),
  ('inc-002', 'proy-001', 'casi_accidente', 'Derrumbe parcial de zanja sin lesionados', '2026-04-20', 'medio', 'investigacion', 'Supervisor García'),
  ('inc-003', 'proy-003', 'accidente', 'Corte con sierra - primeros auxilios', '2026-05-10', 'leve', 'abierto', 'Ing. Ramírez'),
  ('inc-004', 'proy-002', 'condicion_insegura', 'Falta de barandas en losa nivel 2', '2026-06-05', 'medio', 'cerrado', 'Arq. López');

-- 16. NO CONFORMIDADES
INSERT INTO erp_no_conformidades (id, proyecto_id, descripcion, tipo, estado, fecha, responsable)
VALUES
  ('nc-001', 'proy-001', 'Resistencia concreto menor a especificada en columna C-12', 'calidad', 'abierta', '2026-04-10', 'Ing. Pérez'),
  ('nc-002', 'proy-002', 'Desviación en alineación de muro perimetral', 'calidad', 'cerrada', '2026-05-20', 'Arq. López'),
  ('nc-003', 'proy-003', 'Soldadura en junta J-5 no cumple especificación', 'calidad', 'abierta', '2026-06-15', 'Ing. Ramírez');

-- 17. PRUEBAS DE LABORATORIO
INSERT INTO erp_pruebas_laboratorio (id, proyecto_id, tipo, resultado, fecha, estado, notas)
VALUES
  ('prb-001', 'proy-001', 'compresion_concreto', 285, '2026-02-15', 'aprobado', 'Cilindros cimentación - 285 psi (mín 250)'),
  ('prb-002', 'proy-001', 'compresion_concreto', 240, '2026-04-10', 'rechazado', 'Columna C-12 - 240 psi (mín 280)'),
  ('prb-003', 'proy-003', 'suelos', 95, '2026-02-10', 'aprobado', 'Ensayo Proctor estribo norte');

-- 18. PUBLICACIONES MURO
INSERT INTO erp_publicaciones_muro (id, proyecto_id, contenido, autor, created_at, likes, comentarios)
VALUES
  ('pub-001', 'proy-001', 'Hoy iniciamos la fundición de losa nivel 5. Todo según plan.', 'Ing. Pérez', '2026-05-10T08:00:00Z', 5, '[{"id":"c1","autor":"Supervisor García","contenido":"Excelente avance!","createdAt":"2026-05-10T09:00:00Z"}]'),
  ('pub-002', 'proy-001', 'Se detectó fisura en columna C-12, se está evaluando.', 'Supervisor García', '2026-04-12T10:00:00Z', 3, '[]'),
  ('pub-003', 'proy-002', 'Avanzando con la obra gris de las primeras 15 viviendas.', 'Arq. López', '2026-05-20T07:30:00Z', 8, '[]');