const { randomUUID } = require('crypto');
const { Client } = require('pg');
const fs = require('fs');

function loadEnv() {
  const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
  const env = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const connStr = env['CONEXION SPRIN'] || env.CONEXION_SPRIN || env['CONEXION_SPRIN'] || '';

if (!connStr) {
  console.error('No hay CONEXION SPRIN en .env');
  process.exit(1);
}

const client = new Client({ connectionString: connStr });
const uid = () => randomUUID();

async function main() {
  await client.connect();
  console.log('Conectado a PostgreSQL\n');

  const proyectoId = uid();
  console.log('proyectoId:', proyectoId);

  // 1) Proyecto
  const p = await client.query(`
    INSERT INTO erp_proyectos (id, nombre, cliente, ubicacion, tipologia, estado,
      presupuesto_total, monto_contrato, avance_fisico, avance_financiero,
      lat, lng, fecha_inicio, fecha_fin, etapa, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now(),now())
    RETURNING id
  `, [proyectoId, 'Edificio Residencial Vista Hermosa', 'Inmobiliaria Vista Hermosa S.A.',
    'Zona 15, Guatemala', 'residencial', 'ejecucion', 45000000, 52000000, 35, 28,
    14.6032, -90.5153, '2026-04-10', '2026-08-25', 'construccion']);
  console.log('1. proyectos:', p.rowCount);

  // 2) Presupuestos
  const pre = await client.query(`
    INSERT INTO erp_presupuestos (id, proyecto_id, tipologia, renglones,
      total_calculado, costo_directo_total, estado, notas, version_presupuesto,
      fecha_creacion, fecha_actualizacion, created_at, updated_at)
    VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,1,now(),now(),now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'residencial',
    JSON.stringify([
      { codigo: 'R-001', nombre: 'Cimentación', unidad: 'm2', cantidad: 1200, costoMateriales: 850000, costoManoObra: 620000, costoEquipo: 210000, totalCD: 1680000 },
      { codigo: 'R-002', nombre: 'Estructura Concreto', unidad: 'm3', cantidad: 3400, costoMateriales: 6400000, costoManoObra: 2850000, costoEquipo: 950000, totalCD: 10200000 },
      { codigo: 'R-003', nombre: 'Mampostería', unidad: 'm2', cantidad: 18500, costoMateriales: 2100000, costoManoObra: 1650000, costoEquipo: 0, totalCD: 3750000 },
    ]),
    15430000, 13050000, 'aprobado', 'Presupuesto base']);
  console.log('2. presupuestos:', pre.rowCount);

  // 3) Movimientos
  const mov = await client.query(`
    INSERT INTO erp_movimientos (id, tipo, descripcion, proyecto_id, categoria, monto,
      costo_total, unidad, cantidad, fecha, proveedor, factura, forma_pago, created_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now()),
      ($14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,now()),
      ($27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,now()),
      ($40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,now()),
      ($53,$54,$55,$56,$57,$58,$59,$60,$61,$62,$63,$64,$65,now()),
      ($66,$67,$68,$69,$70,$71,$72,$73,$74,$75,$76,$77,$78,now())
    RETURNING id
  `, [uid(), 'ingreso', 'Anticipo cliente Vista Hermosa', proyectoId, 'Anticipo', 15000000, 15000000, 'global', 1, '2026-04-11', 'Inmobiliaria Vista Hermosa', 'ANT-001', 'transferencia',
      uid(), 'gasto', 'Compra de cemento y acero', proyectoId, 'Materiales', 4200000, 4200000, 'global', 1, '2026-04-14', 'Cementos Progreso', 'FAC-501', 'transferencia',
      uid(), 'gasto', 'Mano de obra nivel 1-5', proyectoId, 'Mano de Obra', 3800000, 3800000, 'jornales', 950, '2026-04-21', 'Constructora del Sur', null, 'efectivo',
      uid(), 'gasto', 'Renta de grúa torre', proyectoId, 'Equipo', 650000, 650000, 'meses', 3, '2026-04-29', 'Renta Equipo GT', 'FAC-901', 'transferencia',
      uid(), 'ingreso', 'Segundo anticipo obra gruesa', proyectoId, 'Anticipo', 12000000, 12000000, 'global', 1, '2026-05-19', 'Inmobiliaria Vista Hermosa', 'ANT-002', 'transferencia',
      uid(), 'gasto', 'Mano de obra nivel 6-10', proyectoId, 'Mano de Obra', 4100000, 4100000, 'jornales', 1025, '2026-05-27', 'Constructora del Sur', null, 'efectivo']);
  console.log('3. movimientos:', mov.rowCount);

  // 4) Empleados
  const emp = await client.query(`
    INSERT INTO erp_empleados (id, nombre, puesto, proyecto_id, salario_diario,
      tipo, telefono, dias_trabajados, created_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,now(),now()),
      ($9,$10,$11,$12,$13,$14,$15,$16,now(),now()),
      ($17,$18,$19,$20,$21,$22,$23,$24,now(),now())
    RETURNING id
  `, [uid(), 'Carlos Mendez', 'Residente', proyectoId, 650, 'planilla', '5555-1001', 120,
      uid(), 'Ana Gomez', 'Supervisora', proyectoId, 550, 'planilla', '5555-1002', 90,
      uid(), 'Pedro Lopez', 'Maestro de Obra', proyectoId, 420, 'destajo', '5555-1003', 110]);
  console.log('4. empleados:', emp.rowCount);

  // 5) Materiales
  const mat = await client.query(`
    INSERT INTO erp_materiales (id, nombre, unidad, stock, stock_minimo, precio, critico, created_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,now(),now()),
      ($8,$9,$10,$11,$12,$13,$14,now(),now()),
      ($15,$16,$17,$18,$19,$20,$21,now(),now())
    RETURNING id
  `, [uid(), 'Cemento', 'sacos', 3200, 500, 78.5, false,
      uid(), 'Acero #5', 'varillas', 1800, 400, 142, false,
      uid(), 'Grava', 'm3', 60, 80, 285, true]);
  console.log('5. materiales:', mat.rowCount);

  // 6) Avances
  const av = await client.query(`
    INSERT INTO erp_avances (id, proyecto_id, renglon_id, renglon_nombre, fecha,
      avance_fisico, cantidad_ejecutada, unidad, notas, created_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,now()),
      ($10,$11,$12,$13,$14,$15,$16,$17,$18,now()),
      ($19,$20,$21,$22,$23,$24,$25,$26,$27,now()),
      ($28,$29,$30,$31,$32,$33,$34,$35,$36,now()),
      ($37,$38,$39,$40,$41,$42,$43,$44,$45,now())
    RETURNING id
  `, [uid(), proyectoId, null, 'Cimentación', '2026-04-10', 5, 60, 'm2', 'Inicio de zapatas',
      uid(), proyectoId, null, 'Cimentación', '2026-04-24', 18, 216, 'm2', 'Cimentación parcial nivel 1-3',
      uid(), proyectoId, null, 'Estructura Concreto', '2026-05-06', 28, 952, 'm3', 'Columnas y vigas nivel 6-8',
      uid(), proyectoId, null, 'Estructura Concreto', '2026-05-20', 40, 1360, 'm3', 'Estructura hasta nivel 10',
      uid(), proyectoId, null, 'Mampostería', '2026-05-27', 48, 8880, 'm2', 'Muros interiores nivel 1-9']);
  console.log('6. avances:', av.rowCount);

  // 7) Seguimiento EVM
  const seg = await client.query(`
    INSERT INTO erp_seguimiento (id, proyecto_id, fecha, avance_fisico, avance_financiero,
      costo_planeado, costo_real, valor_planeado, valor_ganado, created_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now()),
      ($10,$11,$12,$13,$14,$15,$16,$17,$18,now(),now()),
      ($19,$20,$21,$22,$23,$24,$25,$26,$27,now(),now()),
      ($28,$29,$30,$31,$32,$33,$34,$35,$36,now(),now()),
      ($37,$38,$39,$40,$41,$42,$43,$44,$45,now(),now()),
      ($46,$47,$48,$49,$50,$51,$52,$53,$54,now(),now())
    RETURNING id
  `, [uid(), proyectoId, '2026-04-10', 5, 4, 520000, 580000, 500000, 480000,
      uid(), proyectoId, '2026-04-24', 18, 15, 1180000, 1250000, 1120000, 1080000,
      uid(), proyectoId, '2026-05-06', 28, 23, 1850000, 1920000, 1780000, 1720000,
      uid(), proyectoId, '2026-05-20', 40, 33, 2420000, 2550000, 2350000, 2280000,
      uid(), proyectoId, '2026-05-27', 48, 38, 2780000, 2900000, 2680000, 2610000,
      uid(), proyectoId, '2026-06-01', 52, 41, 3020000, 3150000, 2920000, 2840000]);
  console.log('7. seguimiento:', seg.rowCount);

  // 8) Hitos
  const hit = await client.query(`
    INSERT INTO erp_hitos (id, proyecto_id, nombre, descripcion, fecha, tipo, estado,
      responsable, depends_on, completado_en, created_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now()),
      ($11,$12,$13,$14,$15,$16,$17,$18,$19,$20,now(),now()),
      ($21,$22,$23,$24,$25,$26,$27,$28,$29,$30,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Inicio de Obra', 'Inicio oficial del proyecto', '2026-04-10', 'inicio', 'completado', 'Ing. Carlos Mendez', null, '2026-04-10',
      uid(), proyectoId, 'Cimentación Terminada', 'Finalización de cimentación', '2026-05-06', 'hito', 'completado', 'Ing. Carlos Mendez', null, '2026-05-04',
      uid(), proyectoId, 'Estructura Nivel 10', 'Estructura hasta nivel 10', '2026-05-27', 'hito', 'en_progreso', 'Ing. Jorge Arriaga', null, null]);
  console.log('8. hitos:', hit.rowCount);

  // 9) Riesgos
  const r = await client.query(`
    INSERT INTO erp_riesgos (id, proyecto_id, nombre, descripcion, tipo, probabilidad,
      impacto, nivel, plan_mitigacion, plan_contingencia, responsable,
      fecha_identificacion, estado, costo_soporte, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Retraso en entrega de acero',
    'Retraso en entrega de acero', 'Técnico', 4, 4, 'alto',
    'Coordinar con proveedor y tener stock de seguridad',
    'Plan de cubierta temporal y bombeo', 'Ing. Jorge Arriaga',
    '2026-04-15', 'abierto', 500000]);
  console.log('9. riesgos:', r.rowCount);
  const r2 = await client.query(`
    INSERT INTO erp_riesgos (id, proyecto_id, nombre, descripcion, tipo, probabilidad,
      impacto, nivel, plan_mitigacion, plan_contingencia, responsable,
      fecha_identificacion, estado, costo_soporte, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Lluvias torrenciales en temporada',
    'Lluvias torrenciales en temporada', 'Climático', 3, 3, 'medio',
    'Plan de cubierta temporal y bombeo', 'Cobertura adicional', 'Ing. Carlos Mendez',
    '2026-04-20', 'mitigado', 0]);
  console.log('9. riesgos:', r.rowCount);

  // 10) Proveedores
  const prv = await client.query(`
    INSERT INTO erp_proveedores (id, nombre, contacto, telefono, email, rubro, categoria,
      calificacion, created_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,now(),now()),
      ($9,$10,$11,$12,$13,$14,$15,$16,now(),now())
    RETURNING id
  `, [uid(), 'Cementos Progreso', 'Luis Morales', '5555-2001', 'ventas@progreso.com', 'Materiales de Construcción', 'materiales', 4,
      uid(), 'Renta Equipo GT', 'Maria Castillo', '5555-2002', 'info@rentaequipo.gt', 'Renta de Maquinaria', 'equipo', 4]);
  console.log('10. proveedores:', prv.rowCount);

  // 11) Ordenes de Compra
  const oc = await client.query(`
    INSERT INTO erp_ordenes_compra (id, proyecto_id, proveedor, material, cantidad, monto,
      estado, fecha, items, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Cementos Progreso', 'Cemento + Acero', 150, 42000000, 'recibida', '2026-04-14',
    JSON.stringify([{ materialId: 'mat-01', cantidad: 500, precioUnitario: 78.5 }, { materialId: 'mat-02', cantidad: 120, precioUnitario: 142 }])]);
  console.log('11. ordenes_compra:', oc.rowCount);

  // 12) Cuentas por Cobrar
  const cc = await client.query(`
    INSERT INTO erp_cuentas_cobrar (id, proyecto_id, cliente, concepto, monto, saldo_pendiente,
      fecha_emision, fecha_vencimiento, estado, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Inmobiliaria Vista Hermosa S.A.', 'Anticipo obra', 52000000, 25000000, '2026-04-10', '2026-07-29', 'parcial']);
  console.log('12. cuentas_cobrar:', cc.rowCount);

  // 13) Cuentas por Pagar
  const cp = await client.query(`
    INSERT INTO erp_cuentas_pagar (id, proyecto_id, proveedor, concepto, monto, saldo_pendiente,
      fecha_emision, fecha_vencimiento, estado, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Cementos Progreso', 'Compra cemento y acero', 42000000, 12000000, '2026-04-14', '2026-05-19', 'parcial']);
  console.log('13. cuentas_pagar:', cp.rowCount);

  // 14) Bitácora
  const b = await client.query(`
    INSERT INTO erp_bitacora (id, proyecto_id, fecha, clima, personal, maquinaria,
      tareas, observaciones, lat, lng, created_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now()),
      ($11,$12,$13,$14,$15,$16,$17,$18,$19,$20,now(),now())
    RETURNING id
  `, [uid(), proyectoId, '2026-04-20', 'soleado', 45, 'Grúa torre, concretera', 'Colado columna nivel 3-5', 'Sin incidencias', 14.6032, -90.5153,
      uid(), proyectoId, '2026-05-06', 'nublado', 60, 'Grúa torre, vibrador', 'Colado losa nivel 6-8', 'Llovizna ligera', 14.6032, -90.5153];
  console.log('14. bitacora:', b.rowCount);

  // 15) Eventos Calendario
  const ev = await client.query(`
    INSERT INTO erp_eventos_calendario (id, proyecto_id, titulo, descripcion, fecha, hora,
      tipo, completado, created_at, updated_at)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,now(),now()),
      ($9,$10,$11,$12,$13,$14,$15,$16,now(),now()),
      ($17,$18,$19,$20,$21,$22,$23,$24,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Revisión de estructura nivel 8', 'Inspección previa a colado', '2026-04-29', '09:00', 'reunion', true,
      uid(), proyectoId, 'Entrega acero estructural', 'Llegada de 120 varillas', '2026-05-01', '14:00', 'entrega', true,
      uid(), proyectoId, 'Pago anticipo 2', 'Transferencia por Q12,000,000', '2026-05-06', '10:00', 'pago', true];
  console.log('15. eventos_calendario:', ev.rowCount);

  // 16) Publicaciones Muro (INSERT en tabla base, NO en vista)
  const muro = await client.query(`
    INSERT INTO erp_muro (id, proyecto_id, autor, contenido, tipo, likes, fotos, comentarios, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Ing. Carlos Mendez', 'Avance del 40% en estructura. Siguiente hito: losa nivel 12.', 'general', 5, '{}', '{}']);
  console.log('16. erp_muro:', muro.rowCount);

  // 17) Licitaciones
  const lic = await client.query(`
    INSERT INTO erp_licitaciones (id, proyecto_id, nombre, cliente, monto, fecha_limite,
      estado, documentos, notas, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'LIC-2026-001', 'Ministerio de Comunicaciones', 52000000, '2026-06-25', 'presentada', '[]', 'Licitación pública']);
  console.log('17. licitaciones:', lic.rowCount);

  // 18) Cotizaciones Negocio
  const cot = await client.query(`
    INSERT INTO erp_cotizaciones_negocio (id, proyecto_id, tipo, numero, fecha,
      fecha_vencimiento, cliente_nombre, cliente_nit, cliente_telefono, cliente_email,
      descripcion, renglones, costo_directo_total, precio_venta_total, estado, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'venta', 'COT-2026-001', '2026-05-15', '2026-06-14',
    'Inmobiliaria Vista Hermosa S.A.', '12345678-9', '2222-3333', 'contacto@vistahermosa.com.gt',
    'Construcción torre 15 niveles',
    JSON.stringify([{ descripcion: 'Construcción torre', cantidad: 1, precio: 52000000 }]),
    45000000, 52000000, 'aprobada'];
  console.log('18. cotizaciones_negocio:', cot.rowCount);

  // 19) Vales Salida
  const vs = await client.query(`
    INSERT INTO erp_vales_salida (id, proyecto_id, fecha, items, observaciones,
      solicitante, created_by, created_at, updated_at)
    VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,now(),now())
    RETURNING id
  `, [uid(), proyectoId, '2026-05-20',
    JSON.stringify([{ materialId: 'mat-01', cantidad: 100, unidad: 'sacos' }]),
    'Salida para nivel 12', 'Ing. Carlos Mendez', proyectoId];
  console.log('19. vales_salida:', vs.rowCount);

  // 20) Notificaciones
  const notif = await client.query(`
    INSERT INTO erp_notificaciones (id, tipo, titulo, mensaje, proyecto_id,
      referencia_id, leido, created_at, created_by)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,now(),$8),
      ($9,$10,$11,$12,$13,$14,$15,now(),$16)
    RETURNING id
  `, [uid(), 'avance', 'Avance registrado', 'Se registró avance del 48% en Mampostería', proyectoId, null, false, proyectoId,
      uid(), 'riesgo', 'Riesgo abierto', 'Retraso en entrega de acero', proyectoId, null, false, proyectoId];
  console.log('20. notificaciones:', notif.rowCount);

  // 21) Incidentes
  const inc = await client.query(`
    INSERT INTO erp_incidentes (id, proyecto_id, tipo, descripcion, fecha, estado,
      reportado_por, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'seguridad', 'Incidente leve: caída de herramienta', '2026-05-10', 'resuelto', 'Ing. Jorge Arriaga'];
  console.log('21. incidentes:', inc.rowCount);

  // 22) Liberaciones Partida
  const lib = await client.query(`
    INSERT INTO erp_liberaciones_partida (id, proyecto_id, renglon_nombre, fecha_solicitud,
      fecha_liberacion, solicitante, supervisor, checklist_aprobado,
      observaciones, estado, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Cimentación', '2026-04-18', '2026-04-20',
    'Ing. Carlos Mendez', 'Ing. Jorge Arriaga', true,
    'Cumple normativa', 'aprobado'];
  console.log('22. liberaciones_partida:', lib.rowCount);

  // 23) Planos
  const pl = await client.query(`
    INSERT INTO erp_planos (id, proyecto_id, nombre, tipo, version, estado,
      disciplina, observaciones, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'Plano Estructural Nivel 10', 'estructural', 2, 'aprobado', 'Estructural', 'Versión corregida'];
  console.log('23. planos:', pl.rowCount);

  // 24) RFIs
  const rfi = await client.query(`
    INSERT INTO erp_rfis (id, proyecto_id, numero, titulo, descripcion, remitente,
      destinatario, fecha_envio, fecha_respuesta_esperada, respuesta, estado,
      prioridad, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'RFI-001', 'Espesor losa nivel 12',
    'Confirmar espesor de losa según plano', 'Ing. Carlos Mendez', 'Arq. María López',
    '2026-05-05', '2026-05-12', 'Espesor 20cm confirmado', 'respondido', 'alta'];
  console.log('24. rfis:', rfi.rowCount);

  // 25) Submittals
  const sub = await client.query(`
    INSERT INTO erp_submittals (id, proyecto_id, numero, titulo, descripcion,
      fecha_envio, fecha_aprobacion, estado, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'SUB-001', 'Especificación acero estructural',
    'Acero grado 60', '2026-04-25', '2026-04-30', 'aprobado'];
  console.log('25. submittals:', sub.rowCount);

  // 26) Cuadros Comparativos
  const ccomp = await client.query(`
    INSERT INTO erp_cuadros_comparativos (id, proyecto_id, solicitud, fecha_solicitud,
      fecha_cierre, estado, adjudicado_a, observaciones, created_by, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING id
  `, [uid(), proyectoId, 'Comparativa proveedores cemento', '2026-04-16', '2026-04-20',
    'adjudicado', null, 'Seleccionado Cementos Progreso', proyectoId, new Date()];
  console.log('26. cuadros_comparativos:', ccomp.rowCount);

  // 27) Pruebas Laboratorio
  const prb = await client.query(`
    INSERT INTO erp_pruebas_laboratorio (id, proyecto_id, tipo, descripcion, fecha_muestra,
      fecha_resultado, resultado, responsable, observaciones, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'concreto', 'Prueba resistencia concreto f\'c=280',
    '2026-04-18', '2026-04-25', 'aprobado', 'Ing. Carlos Mendez', 'Resistencia cumplida'];
  console.log('27. pruebas_laboratorio:', prb.rowCount);

  // 28) No Conformidades
  const nc = await client.query(`
    INSERT INTO erp_no_conformidades (id, proyecto_id, codigo, descripcion, categoria,
      fecha_deteccion, detectado_por, plan_accion, responsable_cierre,
      fecha_cierre, estado, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'NC-001', 'Desviación en colado nivel 5',
    'calidad', '2026-04-22', 'Inspector Municipal',
    'Reforzado y reparado', 'Ing. Carlos Mendez', '2026-04-25', 'cerrada'];
  console.log('28. no_conformidades:', nc.rowCount);

  // 29) Ordenes de Cambio
  const oc2 = await client.query(`
    INSERT INTO erp_ordenes_cambio (id, proyecto_id, titulo, descripcion, impacto_costo,
      impacto_plazo, estado, solicitante, solicitante_rol, aprobador,
      fecha_aprobacion, created_at, updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),now())
    RETURNING id
  `, [uid(), proyectoId, 'OC-001 Cambio fachada', 'Cambio de material fachada principal',
    2500000, 7, 'aprobada', 'Ing. Carlos Mendez', 'Residente', null, null];
  console.log('29. ordenes_cambio:', oc2.rowCount);

  console.log('\n=== VERIFICANDO TODAS LAS TABLAS ===\n');
  const tables = [
    'erp_proyectos','erp_presupuestos','erp_movimientos','erp_empleados',
    'erp_materiales','erp_avances','erp_seguimiento','erp_hitos',
    'erp_riesgos','erp_proveedores','erp_ordenes_compra','erp_bitacora',
    'erp_eventos_calendario','erp_publicaciones_muro','erp_cuentas_cobrar',
    'erp_cuentas_pagar','erp_licitaciones','erp_cotizaciones_negocio',
    'erp_vales_salida','erp_notificaciones','erp_incidentes',
    'erp_liberaciones_partida','erp_planos','erp_rfis',
    'erp_submittals','erp_cuadros_comparativos','erp_pruebas_laboratorio',
    'erp_no_conformidades','erp_muro','cuadro_comparativo_proveedores',
    'erp_ordenes_cambio'
  ];

  for (const t of tables) {
    try {
      const r = await client.query(`SELECT COUNT(*) as cnt FROM ${t}`);
      console.log(`  ${t}: ${r.rows[0].cnt} registros`);
    } catch (err) {
      console.log(`  ${t}: ${err.message.slice(0, 70)}`);
    }
  }

  console.log('\n=== PROCESO COMPLETADO ===');
  await client.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
