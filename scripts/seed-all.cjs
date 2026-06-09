const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
const env = {};
for (const raw of lines) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx === -1) continue;
  env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}

const SERVICE_ROLE = env.TOKEN_SUPABASE;
const ANON = env.VITE_SUPABASE_KEY;
const URL = env.VITE_SUPABASE_URL;

if (!SERVICE_ROLE || !URL) {
  console.error('Faltan TOKEN_SUPABASE o VITE_SUPABASE_URL');
  process.exit(1);
}

const admin = createClient(URL, SERVICE_ROLE, { auth: { persistSession: false } });
const anon = createClient(URL, ANON, { auth: { persistSession: false } });

const d = (offset = 0) => {
  const dt = new Date(); dt.setDate(dt.getDate() - offset);
  return dt.toISOString().slice(0, 10);
};

async function seed() {
  console.log('=== SEED con TOKEN_SUPABASE (service_role) ===\n');

  // 1 Proyecto
  const p = await admin.from('erp_proyectos').upsert({
    id: 'p-vista-hermosa', nombre: 'Edificio Residencial Vista Hermosa',
    descripcion: 'Torre de 15 niveles con 120 unidades residenciales', tipologia: 'residencial',
    tipoObra: 'nueva', cliente: 'Inmobiliaria Vista Hermosa S.A.',
    clienteNit: '12345678-9', clienteTelefono: '2222-3333',
    clienteEmail: 'contacto@vistahermosa.com.gt', ubicacion: 'Zona 15, Guatemala',
    direccion: 'Calzada Agua Zarca 12-34', ciudad: 'Guatemala',
    departamento: 'Guatemala', codigoPostal: '01515', pais: 'Guatemala',
    areaConstruccion: 25000, numPisos: 15, plazoSemanas: 104,
    ingenieroResidente: 'Ing. Roberto Mazariegos', supervisor: 'Ing. Jorge Arriaga',
    arquitecto: 'Arq. María López', numeroExpediente: 'EXP-2026-001',
    numeroLicencia: 'LIC-MUN-2026-015', presupuestoTotal: 45000000,
    montoContrato: 52000000, fechaInicio: d(-60), fechaFin: d(44),
    avanceFisico: 35, avanceFinanciero: 28, estado: 'ejecucion', etapa: 'construccion',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).select();
  console.log('1. proyectos:', p.error ? 'ERROR: ' + p.error.message : 'OK (' + (p.data?.length || 0) + ')');

  // 2 Presupuestos
  const pre = await admin.from('erp_presupuestos').upsert({
    id: 'pres-vh-01', proyecto_id: 'p-vista-hermosa', tipologia: 'residencial',
    renglones: JSON.stringify([
      { codigo: 'R-001', nombre: 'Cimentación', unidad: 'm2', cantidad: 1200, costoMateriales: 850000, costoManoObra: 620000, costoEquipo: 210000, totalCD: 1680000 },
      { codigo: 'R-002', nombre: 'Estructura Concreto', unidad: 'm3', cantidad: 3400, costoMateriales: 6400000, costoManoObra: 2850000, costoEquipo: 950000, totalCD: 10200000 },
      { codigo: 'R-003', nombre: 'Mampostería', unidad: 'm2', cantidad: 18500, costoMateriales: 2100000, costoManoObra: 1650000, costoEquipo: 0, totalCD: 3750000 },
    ]),
    total_calculado: 15430000, costo_directo_total: 13050000, estado: 'aprobado',
    notas: 'Presupuesto base licitación',
  }).select();
  console.log('2. presupuestos:', pre.error ? 'ERROR: ' + pre.error.message : 'OK');

  // 3 Movimientos
  const mov = await admin.from('erp_movimientos').upsert([
    { id: 'mov-01', tipo: 'ingreso', descripcion: 'Anticipo cliente Vista Hermosa', proyecto_id: 'p-vista-hermosa', categoria: 'Anticipo', monto: 15000000, costoTotal: 15000000, unidad: 'global', cantidad: 1, fecha: d(-58), proveedor: 'Inmobiliaria Vista Hermosa S.A.', factura: 'ANT-001', formaPago: 'transferencia' },
    { id: 'mov-02', tipo: 'gasto', descripcion: 'Compra de cemento y acero', proyecto_id: 'p-vista-hermosa', categoria: 'Materiales', monto: 4200000, costoTotal: 4200000, unidad: 'global', cantidad: 1, fecha: d(-55), proveedor: 'Cementos Progreso', factura: 'FAC-501', formaPago: 'transferencia' },
    { id: 'mov-03', tipo: 'gasto', descripcion: 'Mano de obra nivel 1-5', proyecto_id: 'p-vista-hermosa', categoria: 'Mano de Obra', monto: 3800000, costoTotal: 3800000, unidad: 'jornales', cantidad: 950, fecha: d(-48), proveedor: 'Constructora del Sur', formaPago: 'efectivo' },
    { id: 'mov-04', tipo: 'gasto', descripcion: 'Renta de grúa torre', proyecto_id: 'p-vista-hermosa', categoria: 'Equipo', monto: 650000, costoTotal: 650000, unidad: 'meses', cantidad: 3, fecha: d(-40), proveedor: 'Renta Equipo GT', factura: 'FAC-901', formaPago: 'transferencia' },
    { id: 'mov-05', tipo: 'ingreso', descripcion: 'Segundo anticipo obra gruesa', proyecto_id: 'p-vista-hermosa', categoria: 'Anticipo', monto: 12000000, costoTotal: 12000000, unidad: 'global', cantidad: 1, fecha: d(-20), proveedor: 'Inmobiliaria Vista Hermosa S.A.', factura: 'ANT-002', formaPago: 'transferencia' },
    { id: 'mov-06', tipo: 'gasto', descripcion: 'Mano de obra nivel 6-10', proyecto_id: 'p-vista-hermosa', categoria: 'Mano de Obra', monto: 4100000, costoTotal: 4100000, unidad: 'jornales', cantidad: 1025, fecha: d(-12), proveedor: 'Constructora del Sur', formaPago: 'efectivo' },
  ]).select();
  console.log('3. movimientos:', mov.error ? 'ERROR: ' + mov.error.message : 'OK');

  // 4 Empleados
  const emp = await admin.from('erp_empleados').upsert([
    { id: 'emp-01', nombre: 'Carlos Mendez', puesto: 'Residente', proyectoId: 'p-vista-hermosa', salarioDiario: 650, tipo: 'planilla', activo: true, proyectoIds: ['p-vista-hermosa'], telefono: '5555-1001', diasTrabajados: 120, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'emp-02', nombre: 'Ana Gomez', puesto: 'Supervisora', proyectoId: 'p-vista-hermosa', salarioDiario: 550, tipo: 'planilla', activo: true, proyectoIds: ['p-vista-hermosa'], telefono: '5555-1002', diasTrabajados: 90, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'emp-03', nombre: 'Pedro Lopez', puesto: 'Maestro de Obra', proyectoId: 'p-vista-hermosa', salarioDiario: 420, tipo: 'destajo', activo: true, proyectoIds: ['p-vista-hermosa'], telefono: '5555-1003', diasTrabajados: 110, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]).select();
  console.log('4. empleados:', emp.error ? 'ERROR: ' + emp.error.message : 'OK');

  // 5 Materiales
  const mat = await admin.from('erp_materiales').upsert([
    { id: 'mat-01', nombre: 'Cemento', unidad: 'sacos', stock: 3200, stockMinimo: 500, precio: 78.5, categoria: 'Materiales', proyectoIds: ['p-vista-hermosa'], critico: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'mat-02', nombre: 'Acero #5', unidad: 'varillas', stock: 1800, stockMinimo: 400, precio: 142, categoria: 'Materiales', proyectoIds: ['p-vista-hermosa'], critico: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'mat-03', nombre: 'Grava', unidad: 'm3', stock: 60, stockMinimo: 80, precio: 285, categoria: 'Materiales', proyectoIds: ['p-vista-hermosa'], critico: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]).select();
  console.log('5. materiales:', mat.error ? 'ERROR: ' + mat.error.message : 'OK');

  // 6 Avances
  const av = await admin.from('erp_avances').upsert([
    { id: 'av-01', proyecto_id: 'p-vista-hermosa', renglon_id: 'R-001', renglon_codigo: 'R-001', renglon_nombre: 'Cimentación', fecha: d(-56), avance_fisico: 5, cantidad_ejecutada: 60, unidad: 'm2', notas: 'Inicio de zapatas' },
    { id: 'av-02', proyecto_id: 'p-vista-hermosa', renglon_id: 'R-001', renglon_codigo: 'R-001', renglon_nombre: 'Cimentación', fecha: d(-42), avance_fisico: 18, cantidad_ejecutada: 216, unidad: 'm2', notas: 'Cimentación parcial nivel 1-3' },
    { id: 'av-03', proyecto_id: 'p-vista-hermosa', renglon_id: 'R-002', renglon_codigo: 'R-002', renglon_nombre: 'Estructura Concreto', fecha: d(-30), avance_fisico: 28, cantidad_ejecutada: 952, unidad: 'm3', notas: 'Columnas y vigas nivel 6-8' },
    { id: 'av-04', proyecto_id: 'p-vista-hermosa', renglon_id: 'R-002', renglon_codigo: 'R-002', renglon_nombre: 'Estructura Concreto', fecha: d(-14), avance_fisico: 40, cantidad_ejecutada: 1360, unidad: 'm3', notas: 'Estructura hasta nivel 10' },
    { id: 'av-05', proyecto_id: 'p-vista-hermosa', renglon_id: 'R-003', renglon_codigo: 'R-003', renglon_nombre: 'Mampostería', fecha: d(-7), avance_fisico: 48, cantidad_ejecutada: 8880, unidad: 'm2', notas: 'Muros interiores nivel 1-9' },
  ]).select();
  console.log('6. avances:', av.error ? 'ERROR: ' + av.error.message : 'OK');

  // 7 Seguimiento EVM
  const seg = await admin.from('erp_seguimiento').upsert([
    { id: 'seg-01', proyecto_id: 'p-vista-hermosa', fecha: d(-56), avance_fisico: 5, avance_financiero: 4, costo_planeado: 520000, costo_real: 580000, valor_planeado: 500000, valor_ganado: 480000 },
    { id: 'seg-02', proyecto_id: 'p-vista-hermosa', fecha: d(-42), avance_fisico: 18, avance_financiero: 15, costo_planeado: 1180000, costo_real: 1250000, valor_planeado: 1120000, valor_ganado: 1080000 },
    { id: 'seg-03', proyecto_id: 'p-vista-hermosa', fecha: d(-30), avance_fisico: 28, avance_financiero: 23, costo_planeado: 1850000, costo_real: 1920000, valor_planeado: 1780000, valor_ganado: 1720000 },
    { id: 'seg-04', proyecto_id: 'p-vista-hermosa', fecha: d(-14), avance_fisico: 40, avance_financiero: 33, costo_planeado: 2420000, costo_real: 2550000, valor_planeado: 2350000, valor_ganado: 2280000 },
    { id: 'seg-05', proyecto_id: 'p-vista-hermosa', fecha: d(-7), avance_fisico: 48, avance_financiero: 38, costo_planeado: 2780000, costo_real: 2900000, valor_planeado: 2680000, valor_ganado: 2610000 },
    { id: 'seg-06', proyecto_id: 'p-vista-hermosa', fecha: d(-3), avance_fisico: 52, avance_financiero: 41, costo_planeado: 3020000, costo_real: 3150000, valor_planeado: 2920000, valor_ganado: 2840000 },
  ]).select();
  console.log('7. seguimiento:', seg.error ? 'ERROR: ' + seg.error.message : 'OK');

  // 8 Hitos
  const hit = await admin.from('erp_hitos').upsert([
    { id: 'hito-01', proyecto_id: 'p-vista-hermosa', nombre: 'Inicio de Obra', fecha_planificada: d(-60), fecha_real: d(-60), estado: 'completado', responsable: 'Ing. Carlos Mendez', porcentaje_avance: 100 },
    { id: 'hito-02', proyecto_id: 'p-vista-hermosa', nombre: 'Cimentación Terminada', fecha_planificada: d(-30), fecha_real: d(-28), estado: 'completado', responsable: 'Ing. Carlos Mendez', porcentaje_avance: 100 },
    { id: 'hito-03', proyecto_id: 'p-vista-hermosa', nombre: 'Estructura Nivel 10', fecha_planificada: d(-15), fecha_real: null, estado: 'en_progreso', responsable: 'Ing. Jorge Arriaga', porcentaje_avance: 65 },
  ]).select();
  console.log('8. hitos:', hit.error ? 'ERROR: ' + hit.error.message : 'OK');

  // 9 Riesgos
  const r = await admin.from('erp_riesgos').upsert([
    { id: 'riesgo-01', proyecto_id: 'p-vista-hermosa', categoria: 'Técnico', descripcion: 'Retraso en entrega de acero', probabilidad: 4, impacto: 4, mitigacion: 'Coordinar con proveedor y tener stock de seguridad', responsable: 'Ing. Jorge Arriaga', estado: 'abierto' },
    { id: 'riesgo-02', proyecto_id: 'p-vista-hermosa', categoria: 'Climático', descripcion: 'Lluvias torrenciales en temporada', probabilidad: 3, impacto: 3, mitigacion: 'Plan de cubierta temporal y bombeo', responsable: 'Ing. Carlos Mendez', estado: 'mitigado' },
  ]).select();
  console.log('9. riesgos:', r.error ? 'ERROR: ' + r.error.message : 'OK');

  // 10 Proveedores
  const prv = await admin.from('erp_proveedores').upsert([
    { id: 'prov-01', nombre: 'Cementos Progreso', contacto: 'Luis Morales', telefono: '5555-2001', email: 'ventas@progreso.com', categoria: 'materiales', rubro: 'Materiales de Construcción', calificacion: 4 },
    { id: 'prov-02', nombre: 'Renta Equipo GT', contacto: 'Maria Castillo', telefono: '5555-2002', email: 'info@rentaequipo.gt', categoria: 'equipo', rubro: 'Renta de Maquinaria', calificacion: 4 },
  ]).select();
  console.log('10. proveedores:', prv.error ? 'ERROR: ' + prv.error.message : 'OK');

  // 11 Ordenes Compra
  const oc = await admin.from('erp_ordenes_compra').upsert([
    { id: 'oc-01', proyecto_id: 'p-vista-hermosa', proveedor: 'Cementos Progreso', material: 'Cemento + Acero', cantidad: 150, monto: 42000000, estado: 'recibida', fecha: d(-55), items: JSON.stringify([{ materialId: 'mat-01', cantidad: 500, precioUnitario: 78.5 }, { materialId: 'mat-02', cantidad: 120, precioUnitario: 142 }]), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]).select();
  console.log('11. ordenes_compra:', oc.error ? 'ERROR: ' + oc.error.message : 'OK');

  // 12 Cuentas por Cobrar
  const cc = await admin.from('erp_cuentas_cobrar').upsert([
    { id: 'cc-01', proyecto_id: 'p-vista-hermosa', cliente: 'Inmobiliaria Vista Hermosa S.A.', monto: 52000000, saldo: 25000000, fechaEmision: d(-60), fechaVencimiento: d(30), estado: 'parcial', factura: 'FAC-001-2026' },
  ]).select();
  console.log('12. cuentas_cobrar:', cc.error ? 'ERROR: ' + cc.error.message : 'OK');

  // 13 Cuentas por Pagar
  const cp = await admin.from('erp_cuentas_pagar').upsert([
    { id: 'cp-01', proyecto_id: 'p-vista-hermosa', proveedor: 'Cementos Progreso', monto: 42000000, saldo: 12000000, fechaEmision: d(-55), fechaVencimiento: d(-20), estado: 'parcial', factura: 'FAC-501' },
  ]).select();
  console.log('13. cuentas_pagar:', cp.error ? 'ERROR: ' + cp.error.message : 'OK');

  // 14 Bitacora
  const b = await admin.from('erp_bitacora').upsert([
    { id: 'bit-01', proyecto_id: 'p-vista-hermosa', fecha: d(-50), clima: 'soleado', personal_presente: 45, maquinaria: 'Grúa torre, concretera', tareas: 'Colado columna nivel 3-5', observaciones: 'Sin incidencias', fotos: [], lat: 14.6032, lng: -90.5153 },
    { id: 'bit-02', proyecto_id: 'p-vista-hermosa', fecha: d(-30), clima: 'nublado', personal_presente: 60, maquinaria: 'Grúa torre, vibrador', tareas: 'Colado losa nivel 6-8', observaciones: 'Llovizna ligera', fotos: [], lat: 14.6032, lng: -90.5153 },
  ]).select();
  console.log('14. bitacora:', b.error ? 'ERROR: ' + b.error.message : 'OK');

  // 15 Eventos Calendario
  const ev = await admin.from('erp_eventos_calendario').upsert([
    { id: 'ev-01', proyecto_id: 'p-vista-hermosa', titulo: 'Revisión de estructura nivel 8', fecha: d(-28), hora: '09:00', tipo: 'reunion', participantes: ['Carlos Mendez', 'Ana Gomez'], descripcion: 'Inspección previa a colado', completado: true },
    { id: 'ev-02', proyecto_id: 'p-vista-hermosa', titulo: 'Entrega acero estructural', fecha: d(-24), hora: '14:00', tipo: 'entrega', participantes: ['Jorge Arriaga'], descripcion: 'Llegada de 120 varillas', completado: true },
    { id: 'ev-03', proyecto_id: 'p-vista-hermosa', titulo: 'Pago anticipo 2', fecha: d(-20), hora: '10:00', tipo: 'pago', participantes: ['Maria Lopez'], descripcion: 'Transferencia por Q12,000,000', completado: true },
  ]).select();
  console.log('15. eventos_calendario:', ev.error ? 'ERROR: ' + ev.error.message : 'OK');

  // 16 Publicaciones Muro
  const muro = await admin.from('erp_publicaciones_muro').upsert([
    { id: 'pub-01', proyecto_id: 'p-vista-hermosa', autor: 'Ing. Carlos Mendez', contenido: 'Avance del 40% en estructura. Siguiente hito: losa nivel 12.', fecha: d(-14), likes: 5, adjuntos: [] },
  ]).select();
  console.log('16. publicaciones_muro:', muro.error ? 'ERROR: ' + muro.error.message : 'OK');

  // 17 Licitaciones
  const lic = await admin.from('erp_licitaciones').upsert([
    { id: 'lic-01', proyecto_id: 'p-vista-hermosa', numero: 'LIC-2026-001', entidad: 'Ministerio de Comunicaciones', monto: 52000000, estado: 'presentada', fechaPresentacion: d(-90), fechaApertura: d(-85), ganador: false },
  ]).select();
  console.log('17. licitaciones:', lic.error ? 'ERROR: ' + lic.error.message : 'OK');

  // 18 Cotizaciones Negocio
  const cot = await admin.from('erp_cotizaciones_negocio').upsert([
    { id: 'cot-01', proyecto_id: 'p-vista-hermosa', cliente: 'Inmobiliaria Vista Hermosa S.A.', monto: 52000000, estado: 'aprobada', fecha: d(-30), validez: 30, items: JSON.stringify([{ descripcion: 'Construcción torre 15 niveles', cantidad: 1, precio: 52000000 }]) },
  ]).select();
  console.log('18. cotizaciones_negocio:', cot.error ? 'ERROR: ' + cot.error.message : 'OK');

  // 19 Vales Salida
  const vs = await admin.from('erp_vales_salida').upsert([
    { id: 'vs-01', proyecto_id: 'p-vista-hermosa', fecha: d(-7), solicitante: 'Ing. Carlos Mendez', estado: 'aprobado', items: JSON.stringify([{ materialId: 'mat-01', cantidad: 100, unidad: 'sacos' }]), total: 7850 },
  ]).select();
  console.log('19. vales_salida:', vs.error ? 'ERROR: ' + vs.error.message : 'OK');

  // 20 Notificaciones
  const notif = await admin.from('erp_notificaciones').upsert([
    { id: 'notif-01', tipo: 'avance', proyecto_id: 'p-vista-hermosa', titulo: 'Avance registrado', mensaje: 'Se registró avance del 48% en Mampostería', leido: false, fecha: d(-7) },
    { id: 'notif-02', tipo: 'riesgo', proyecto_id: 'p-vista-hermosa', titulo: 'Riesgo abierto', mensaje: 'Retraso en entrega de acero', leido: false, fecha: d(-3) },
  ]).select();
  console.log('20. notificaciones:', notif.error ? 'ERROR: ' + notif.error.message : 'OK');

  // 21 Incidentes
  const inc = await admin.from('erp_incidentes').upsert([
    { id: 'inc-01', proyecto_id: 'p-vista-hermosa', tipo: 'seguridad', descripcion: 'Incidente leve: caída de herramienta', fecha: d(-15), estado: 'resuelto', severidad: 'baja', responsable: 'Ing. Jorge Arriaga' },
  ]).select();
  console.log('21. incidentes:', inc.error ? 'ERROR: ' + inc.error.message : 'OK');

  // 22 Liberaciones
  const lib = await admin.from('erp_liberaciones_partida').upsert([
    { id: 'lib-01', proyecto_id: 'p-vista-hermosa', partida: 'Cimentación', fecha: d(-28), resultado: 'aprobado', observaciones: 'Cumple normativa', inspector: 'Ing. Carlos Mendez' },
  ]).select();
  console.log('22. liberaciones_partida:', lib.error ? 'ERROR: ' + lib.error.message : 'OK');

  // 23 Planos
  const pl = await admin.from('erp_planos').upsert([
    { id: 'pl-01', proyecto_id: 'p-vista-hermosa', nombre: 'Plano Estructural Nivel 10', version: 'v2.1', fecha: d(-20), estado: 'aprobado', responsable: 'Arq. María López' },
  ]).select();
  console.log('23. planos:', pl.error ? 'ERROR: ' + pl.error.message : 'OK');

  // 24 RFIs
  const rfi = await admin.from('erp_rfis').upsert([
    { id: 'rfi-01', proyecto_id: 'p-vista-hermosa', titulo: 'Espesor losa nivel 12', estado: 'respondido', fechaEnvio: d(-18), fechaRespuesta: d(-15) },
  ]).select();
  console.log('24. rfis:', rfi.error ? 'ERROR: ' + rfi.error.message : 'OK');

  // 25 Submittals
  const sub = await admin.from('erp_submittals').upsert([
    { id: 'sub-01', proyecto_id: 'p-vista-hermosa', titulo: 'Especificación acero estructural', estado: 'aprobado', fechaEnvio: d(-22), fechaRespuesta: d(-18) },
  ]).select();
  console.log('25. submittals:', sub.error ? 'ERROR: ' + sub.error.message : 'OK');

  // 26 Activos
  const act = await admin.from('erp_activos_herramientas').upsert([
    { id: 'act-01', proyecto_id: 'p-vista-hermosa', nombre: 'Grúa torre', tipo: 'maquinaria', estado: 'operativo', ubicacion: 'Obra', fechaAdquisicion: d(-90) },
  ]).select();
  console.log('26. activos_herramientas:', act.error ? 'ERROR: ' + act.error.message : 'OK');

  // 27 Cuadros Comparativos
  const ccomp = await admin.from('erp_cuadros_comparativos').upsert([
    { id: 'ccomp-01', proyecto_id: 'p-vista-hermosa', nombre: 'Comparativa proveedores cemento', fecha: d(-25), proveedorGanador: 'Cementos Progreso', monto: 42000000 },
  ]).select();
  console.log('27. cuadros_comparativos:', ccomp.error ? 'ERROR: ' + ccomp.error.message : 'OK');

  // 28 Pagos Proveedor
  const pp = await admin.from('erp_pagos_proveedor').upsert([
    { id: 'pp-01', proyecto_id: 'p-vista-hermosa', proveedor: 'Cementos Progreso', monto: 42000000, estado: 'parcial', fechaPago: d(-55), factura: 'FAC-501', saldo: 12000000 },
  ]).select();
  console.log('28. pagos_proveedor:', pp.error ? 'ERROR: ' + pp.error.message : 'OK');

  console.log('\n=== VERIFICACIÓN ANON KEY (simula usuario sin auth) ===');
  const tables = [
    'erp_proyectos','erp_presupuestos','erp_movimientos','erp_empleados',
    'erp_materiales','erp_avances','erp_seguimiento','erp_hitos',
    'erp_riesgos','erp_proveedores','erp_ordenes_compra','erp_bitacora',
    'erp_eventos_calendario','erp_publicaciones_muro','erp_cuentas_cobrar',
    'erp_cuentas_pagar','erp_licitaciones','erp_cotizaciones_negocio',
    'erp_vales_salida','erp_notificaciones','erp_incidentes',
    'erp_liberaciones_partida','erp_planos','erp_rfis',
    'erp_submittals','erp_activos_herramientas','erp_cuadros_comparativos',
    'erp_pagos_proveedor'
  ];
  let anonOk = 0, anonErr = 0;
  for (const t of tables) {
    const { count } = await anon.from(t).select('*', { count: 'exact', head: true });
    if (count !== null && count !== undefined) {
      console.log(`  ${t}: ${count} registros`);
      anonOk++;
    } else {
      const { error } = await anon.from(t).select('*').limit(1);
      if (error) { console.log(`  ${t}: BLOQUEADO (${error.message.slice(0,40)})`); anonErr++; }
      else { console.log(`  ${t}: datos visibles`); anonOk++; }
    }
  }
  console.log(`\nTotal visibles anon: ${anonOk}/${tables.length}`);
  if (anonErr > 0) console.log('Tablas bloqueadas para anon:', anonErr);
}

seed().then(() => {
  console.log('\nSeed completado');
}).catch(e => { console.error('Fatal:', e); process.exit(1); });
