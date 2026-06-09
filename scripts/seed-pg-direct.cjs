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
if (!connStr) { console.error('Falta CONEXION SPRIN en .env'); process.exit(1); }

const client = new Client({ connectionString: connStr });
const uid = () => randomUUID();
const now = () => new Date().toISOString();

async function run() {
  await client.connect();
  console.log('Conectado a PostgreSQL\n');

  const pId = uid();
  const ins = (sql, vals) => client.query(sql, vals).then(r => r.rowCount).catch(e => { console.log(`  ERROR: ${e.message.slice(0,90)}`); return 0; });
  const g = (n) => { for (let i = 0; i < n; i++) arguments[i + 1] = uid(); return Array.from(arguments).slice(1); };

  console.log('=== Insertando datos reales ===\n');

  const proy = [uid(), pId, 'Edificio Residencial Vista Hermosa', 'Inmobiliaria Vista Hermosa S.A.', 'Zona 15, Guatemala', 'residencial', 'ejecucion', 45000000, 52000000, 35, 28, 14.6032, -90.5153, '2026-04-10', '2026-08-25', 'construccion', now(), now()];
  console.log('proyectos...', await ins(
    'INSERT INTO erp_proyectos (id,nombre,cliente,ubicacion,tipologia,estado,presupuesto_total,monto_contrato,avance_fisico,avance_financiero,lat,lng,fecha_inicio,fecha_fin,etapa,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)', proy));

  const pre = [uid(), pId, 'residencial', JSON.stringify([{ codigo: 'R-001', nombre: 'Cimentación', unidad: 'm2', cantidad: 1200, costoMateriales: 850000, costoManoObra: 620000, costoEquipo: 210000, totalCD: 1680000 }, { codigo: 'R-002', nombre: 'Estructura Concreto', unidad: 'm3', cantidad: 3400, costoMateriales: 6400000, costoManoObra: 2850000, costoEquipo: 950000, totalCD: 10200000 }, { codigo: 'R-003', nombre: 'Mampostería', unidad: 'm2', cantidad: 18500, costoMateriales: 2100000, costoManoObra: 1650000, costoEquipo: 0, totalCD: 3750000 }]), 15430000, 13050000, 'aprobado', 'Presupuesto base', 1, now(), now()];
  console.log('presupuestos...', await ins(
    'INSERT INTO erp_presupuestos (id,proyecto_id,tipologia,renglones,total_calculado,costo_directo_total,estado,notas,version_presupuesto,fecha_creacion,fecha_actualizacion) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11)', pre));

  const movs = [
    [uid(), 'ingreso', 'Anticipo cliente', pId, 'anticipo', 15000000, 15000000, 'global', 1, '2026-04-11', 'Inmobiliaria Vista Hermosa', 'ANT-001', 'transferencia'],
    [uid(), 'gasto', 'Compra cemento y acero', pId, 'materiales', 4200000, 4200000, 'global', 1, '2026-04-14', 'Cementos Progreso', 'FAC-501', 'transferencia'],
    [uid(), 'gasto', 'Mano de obra 1-5', pId, 'mano_obra', 3800000, 3800000, 'jornales', 950, '2026-04-21', 'Constructora del Sur', null, 'efectivo'],
    [uid(), 'gasto', 'Renta grúa torre', pId, 'herramienta', 650000, 650000, 'meses', 3, '2026-04-29', 'Renta Equipo GT', 'FAC-901', 'transferencia'],
    [uid(), 'ingreso', 'Segundo anticipo', pId, 'anticipo', 12000000, 12000000, 'global', 1, '2026-05-19', 'Inmobiliaria Vista Hermosa', 'ANT-002', 'transferencia'],
    [uid(), 'gasto', 'Mano de obra 6-10', pId, 'mano_obra', 4100000, 4100000, 'jornales', 1025, '2026-05-27', 'Constructora del Sur', null, 'efectivo'],
  ];
  let movCount = 0;
  for (const m of movs) {
    const r = await ins('INSERT INTO erp_movimientos (id,tipo,descripcion,proyecto_id,categoria,costo_total,unidad,cantidad,fecha,proveedor,factura,forma_pago) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', m);
    movCount += r;
  }
  console.log('movimientos:', movCount);

  const emps = [
    [uid(), 'Carlos Mendez', 'Residente', pId, 650, 'planilla', 120],
    [uid(), 'Ana Gomez', 'Supervisora', pId, 550, 'planilla', 90],
    [uid(), 'Pedro Lopez', 'Maestro de Obra', pId, 420, 'destajo', 110],
  ];
  let empCount = 0;
  for (const e of emps) {
    empCount += await ins('INSERT INTO erp_empleados (id,nombre,puesto,proyecto_id,salario_diario,tipo,dias_trabajados) VALUES ($1,$2,$3,$4,$5,$6,$7)', e);
  }
  console.log('empleados:', empCount);

  const mats = [
    [uid(), 'Cemento', 'sacos', 3200, 500, 78.5, false],
    [uid(), 'Acero #5', 'varillas', 1800, 400, 142, false],
    [uid(), 'Grava', 'm3', 60, 80, 285, true],
  ];
  let matCount = 0;
  for (const m of mats) matCount += await ins('INSERT INTO erp_materiales (id,nombre,unidad,stock,stock_minimo,precio,critico) VALUES ($1,$2,$3,$4,$5,$6,$7)', m);
  console.log('materiales:', matCount);

  const avs = [
    [uid(), pId, '2026-04-10', 5, 60, 'm2', 'Inicio de zapatas'],
    [uid(), pId, '2026-04-24', 18, 216, 'm2', 'Cimentación parcial 1-3'],
    [uid(), pId, '2026-05-06', 28, 952, 'm3', 'Columnas y vigas 6-8'],
    [uid(), pId, '2026-05-20', 40, 1360, 'm3', 'Estructura hasta nivel 10'],
    [uid(), pId, '2026-05-27', 48, 8880, 'm2', 'Muros interiores 1-9'],
  ];
  let avCount = 0;
  for (const a of avs) avCount += await ins('INSERT INTO erp_avances (id,proyecto_id,fecha,avance_fisico,cantidad_ejecutada,unidad,notas) VALUES ($1,$2,$3,$4,$5,$6,$7)', a);
  console.log('avances:', avCount);

  const segs = [
    [uid(), pId, '2026-04-10', 5, 4, 520000, 580000, 500000, 480000],
    [uid(), pId, '2026-04-24', 18, 15, 1180000, 1250000, 1120000, 1080000],
    [uid(), pId, '2026-05-06', 28, 23, 1850000, 1920000, 1780000, 1720000],
    [uid(), pId, '2026-05-20', 40, 33, 2420000, 2550000, 2350000, 2280000],
    [uid(), pId, '2026-05-27', 48, 38, 2780000, 2900000, 2680000, 2610000],
    [uid(), pId, '2026-06-01', 52, 41, 3020000, 3150000, 2920000, 2840000],
  ];
  let segCount = 0;
  for (const s of segs) segCount += await ins('INSERT INTO erp_seguimiento (id,proyecto_id,fecha,avance_fisico,avance_financiero,costo_planeado,costo_real,valor_planeado,valor_ganado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', s);
  console.log('seguimiento:', segCount);

  const hits = [
    [uid(), pId, 'Inicio de Obra', 'Inicio oficial', '2026-04-10', 'inicio', 'completado', 'Ing. Carlos Mendez', null, '2026-04-10'],
    [uid(), pId, 'Cimentación Terminada', 'Fin cimentación', '2026-05-06', 'hito', 'completado', 'Ing. Carlos Mendez', null, '2026-05-04'],
    [uid(), pId, 'Estructura Nivel 10', 'Hasta nivel 10', '2026-05-27', 'hito', 'retrasado', 'Ing. Jorge Arriaga', null, null],
  ];
  let hitCount = 0;
  for (const h of hits) hitCount += await ins('INSERT INTO erp_hitos (id,proyecto_id,nombre,descripcion,fecha,tipo,estado,responsable,depends_on,completado_en) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', h);
  console.log('hitos:', hitCount);

  const risks = [
    [uid(), pId, 'Retraso en acero', 'Retraso entrega acero', 'tecnico', 4, 4, 'alto', 'Coordinar con proveedor', 'Stock seguridad', 'Ing. Jorge Arriaga', '2026-04-15', 'en_mitigacion', 500000],
    [uid(), pId, 'Lluvias torrenciales', 'Lluvias temporada', 'ambiental', 3, 3, 'medio', 'Plan cubierta temporal', 'Cobertura adicional', 'Ing. Carlos Mendez', '2026-04-20', 'mitigado', 0],
  ];
  let rCount = 0;
  for (const r of risks) rCount += await ins('INSERT INTO erp_riesgos (id,proyecto_id,nombre,descripcion,tipo,probabilidad,impacto,nivel,plan_mitigacion,plan_contingencia,responsable,fecha_identificacion,estado,costo_soporte) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', r);
  console.log('riesgos:', rCount);

  const provs = [
    [uid(), 'Cementos Progreso', 'Luis Morales', '5555-2001', 'ventas@progreso.com', 'Materiales de Construcción', 'materiales', 4],
    [uid(), 'Renta Equipo GT', 'Maria Castillo', '5555-2002', 'info@rentaequipo.gt', 'Renta de Maquinaria', 'equipo', 4],
  ];
  let prvCount = 0;
  for (const p of provs) prvCount += await ins('INSERT INTO erp_proveedores (id,nombre,contacto,telefono,email,rubro,categoria,calificacion) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', p);
  console.log('proveedores:', prvCount);

  const oc1 = uid();
  console.log('ordenes_compra...', await ins(
    'INSERT INTO erp_ordenes_compra (id,proyecto_id,proveedor,material,cantidad,monto,estado,fecha,items) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)',
    [oc1, pId, 'Cementos Progreso', 'Cemento + Acero', 150, 42000000, 'recibida', '2026-04-14', JSON.stringify([{ materialId: m1, cantidad: 500, precioUnitario: 78.5 }, { materialId: m2, cantidad: 120, precioUnitario: 142 }])]));

  const cc1 = uid();
  console.log('cuentas_cobrar...', await ins(
    'INSERT INTO erp_cuentas_cobrar (id,proyecto_id,cliente,concepto,monto,saldo_pendiente,fecha_emision,fecha_vencimiento,estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [cc1, pId, 'Inmobiliaria Vista Hermosa S.A.', 'Anticipo obra', 52000000, 25000000, '2026-04-10', '2026-07-29', 'parcial']));

  const cp1 = uid();
  console.log('cuentas_pagar...', await ins(
    'INSERT INTO erp_cuentas_pagar (id,proyecto_id,proveedor,concepto,monto,saldo_pendiente,fecha_emision,fecha_vencimiento,estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [cp1, pId, 'Cementos Progreso', 'Compra cemento y acero', 42000000, 12000000, '2026-04-14', '2026-05-19', 'parcial']));

  const b1 = uid(), b2 = uid();
  console.log('bitacora (2)...', (await ins(
    'INSERT INTO erp_bitacora (id,proyecto_id,fecha,clima,personal,maquinaria,tareas,observaciones) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [b1, pId, '2026-04-20', 'soleado', 45, 'Grúa torre, concretera', 'Colado columna nivel 3-5', 'Sin incidencias'])) +
    (await ins(
      'INSERT INTO erp_bitacora (id,proyecto_id,fecha,clima,personal,maquinaria,tareas,observaciones) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [b2, pId, '2026-05-06', 'nublado', 60, 'Grúa torre, vibrador', 'Colado losa nivel 6-8', 'Llovizna ligera'])));

  const ev1 = uid(), ev2 = uid(), ev3 = uid();
  console.log('eventos_calendario (3)...', (await ins(
    'INSERT INTO erp_eventos_calendario (id,proyecto_id,titulo,descripcion,fecha,hora,tipo,completado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [ev1, pId, 'Revisión estructura nivel 8', 'Inspección previa colado', '2026-04-29', '09:00', 'reunion', true])) +
    (await ins(
      'INSERT INTO erp_eventos_calendario (id,proyecto_id,titulo,descripcion,fecha,hora,tipo,completado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [ev2, pId, 'Entrega acero estructural', 'Llegada de 120 varillas', '2026-05-01', '14:00', 'entrega', true])) +
    (await ins(
      'INSERT INTO erp_eventos_calendario (id,proyecto_id,titulo,descripcion,fecha,hora,tipo,completado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [ev3, pId, 'Pago anticipo 2', 'Transferencia por Q12,000,000', '2026-05-06', '10:00', 'pago', true])));

  console.log('publicaciones_muro...', await ins(
    'INSERT INTO erp_muro (id,proyecto_id,autor,contenido,tipo,likes,fotos,comentarios) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [uid(), pId, 'Ing. Carlos Mendez', 'Avance del 40% en estructura.', 'general', 5, '{}', '{}']));

  console.log('licitaciones...', await ins(
    'INSERT INTO erp_licitaciones (id,nombre,cliente,monto,fecha_limite,estado,documentos,notas) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [uid(), 'LIC-2026-001', 'Ministerio de Comunicaciones', 52000000, '2026-06-25', 'activa', '[]', 'Licitación pública']));

  console.log('cotizaciones_negocio...', await ins(
    'INSERT INTO erp_cotizaciones_negocio (id,tipo,numero,fecha,fecha_vencimiento,cliente_nombre,cliente_nit,cliente_telefono,cliente_email,descripcion,renglones,costo_directo_total,precio_venta_total,estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14)',
    [uid(), 'venta', 'COT-2026-001', '2026-05-15', '2026-06-14', 'Inmobiliaria Vista Hermosa S.A.', '12345678-9', '2222-3333', 'contacto@vistahermosa.com.gt', 'Construcción torre', JSON.stringify([{ descripcion: 'Construcción torre', cantidad: 1, precio: 52000000 }]), 45000000, 52000000, 'borrador']));

  console.log('vales_salida...', await ins(
    'INSERT INTO erp_vales_salida (id,proyecto_id,fecha,items,observaciones,solicitante) VALUES ($1,$2,$3,$4::jsonb,$5,$6)',
    [uid(), pId, '2026-05-20', JSON.stringify([{ materialId: m1, cantidad: 100, unidad: 'sacos' }]), 'Salida nivel 12', 'Ing. Carlos Mendez']));

  console.log('notificaciones (2)...', (await ins(
    'INSERT INTO erp_notificaciones (id,tipo,titulo,mensaje,proyecto_id,referencia_id,leido) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [uid(), 'avance', 'Avance registrado', 'Avance del 48% en Mampostería', pId, null, false])) +
    (await ins(
      'INSERT INTO erp_notificaciones (id,tipo,titulo,mensaje,proyecto_id,referencia_id,leido) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [uid(), 'riesgo', 'Riesgo abierto', 'Retraso en entrega de acero', pId, null, false])));

  console.log('incidentes...', await ins(
    'INSERT INTO erp_incidentes (id,proyecto_id,tipo,fecha,descripcion,afectados,reportado_por,estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [uid(), pId, 'incidente', '2026-05-10', 'Incidente leve: caída de herramienta', '1 persona', 'Ing. Jorge Arriaga', 'cerrado']));

  console.log('liberaciones_partida...', await ins(
    'INSERT INTO erp_liberaciones_partida (id,proyecto_id,renglon_nombre,fecha_solicitud,solicitante,supervisor,checklist_aprobado,observaciones,estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [uid(), pId, 'Cimentación', '2026-04-18', 'Ing. Carlos Mendez', 'Ing. Jorge Arriaga', true, 'Cumple normativa', 'liberado']));

  console.log('planos...', await ins(
    'INSERT INTO erp_planos (id,proyecto_id,nombre,tipo,version,estado,disciplina,observaciones) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [uid(), pId, 'Plano Estructural Nivel 10', 'estructural', 2, 'aprobado', 'Estructural', 'Versión corregida']));

  console.log('rfis...', await ins(
    'INSERT INTO erp_rfis (id,proyecto_id,numero,titulo,descripcion,remitente,destinatario,fecha_envio,fecha_respuesta_esperada,respuesta,estado,prioridad) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
    [uid(), pId, 'RFI-001', 'Espesor losa nivel 12', 'Confirmar espesor losa', 'Ing. Carlos Mendez', 'Arq. María López', '2026-05-05', '2026-05-12', 'Espesor 20cm confirmado', 'respondido', 'alta']));

  console.log('submittals...', await ins(
    'INSERT INTO erp_submittals (id,proyecto_id,numero,titulo,descripcion,fecha_envio,fecha_aprobacion,estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [uid(), pId, 'SUB-001', 'Especificación acero estructural', 'Acero grado 60', '2026-04-25', '2026-04-30', 'aprobado']));

  const prov1 = pv1;
  const ccm = [ccmp1, pId, 'Comparativa proveedores cemento', '2026-04-16', '2026-04-20', 'adjudicado', prov1, 'Seleccionado Cementos Progreso', pId, now()];
  console.log('cuadros_comparativos...', await ins(
    'INSERT INTO cuadro_comparativo_proveedores (id,proyecto_id,solicitud,fecha_solicitud,fecha_cierre,estado,adjudicado_a,observaciones,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', ccm));

  console.log('pruebas_laboratorio...', await ins(
    'INSERT INTO erp_pruebas_laboratorio (id,proyecto_id,tipo,descripcion,fecha_muestra,fecha_resultado,resultado,responsable,observaciones) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [uid(), pId, 'concreto', 'Prueba resistencia concreto fc=280', '2026-04-18', '2026-04-25', 'pasa', 'Ing. Carlos Mendez', 'Resistencia cumplida']));

  console.log('no_conformidades...', await ins(
    'INSERT INTO erp_no_conformidades (id,proyecto_id,codigo,descripcion,categoria,fecha_deteccion,detectado_por,plan_accion,responsable_cierre,fecha_cierre,estado) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [uid(), pId, 'NC-uniq-' + uid().slice(0, 8), 'Desviación en colado nivel 5', 'proceso', '2026-04-22', 'Inspector Municipal', 'Reforzado y reparado', 'Ing. Carlos Mendez', '2026-04-25', 'cerrado']));

  console.log('ordenes_cambio...', await ins(
    'INSERT INTO erp_ordenes_cambio (id,proyecto_id,titulo,descripcion,impacto_costo,impacto_plazo,estado,solicitante,solicitante_rol) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [oc2, pId, 'OC-001 Cambio fachada', 'Cambio de material fachada', 2500000, 7, 'solicitud', 'Ing. Carlos Mendez', 'Residente']));

  console.log('\n=== Verificando tablas ===\n');
  const tables = [
    'erp_proyectos','erp_presupuestos','erp_movimientos','erp_empleados',
    'erp_materiales','erp_avances','erp_seguimiento','erp_hitos',
    'erp_riesgos','erp_proveedores','erp_ordenes_compra','erp_bitacora',
    'erp_eventos_calendario','erp_publicaciones_muro','erp_cuentas_cobrar',
    'erp_cuentas_pagar','erp_licitaciones','erp_cotizaciones_negocio',
    'erp_vales_salida','erp_notificaciones','erp_incidentes',
    'erp_liberaciones_partida','erp_planos','erp_rfis',
    'erp_submittals','erp_cuadros_comparativos','erp_pruebas_laboratorio',
    'erp_no_conformidades','erp_muro','erp_ordenes_cambio'
  ];
  let ok = 0, fail = 0;
  for (const t of tables) {
    try {
      const r = await client.query(`SELECT COUNT(*) as cnt FROM ${t}`);
      const c = parseInt(r.rows[0].cnt);
      console.log(`  ${t}: ${c}`);
      if (c > 0) ok++; else fail++;
    } catch (err) {
      console.log(`  ${t}: ${err.message.slice(0,70)}`);
      fail++;
    }
  }
  console.log(`\nTablas con datos: ${ok}/${tables.length}`);

  console.log('\n=== COMPLETADO ===');
  await client.end();
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
