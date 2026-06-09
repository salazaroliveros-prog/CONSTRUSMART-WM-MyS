import { supabase } from '../../lib/supabase';

const proyectoId = 'p-vista-hermosa';
const now = new Date();
const d = (offsetDays = 0) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() - offsetDays);
  return dt.toISOString().slice(0, 10);
};

async function seed() {
  const { error: proyErr } = await supabase.from('erp_proyectos').upsert({
    id: proyectoId,
    nombre: 'Edificio Residencial Vista Hermosa',
    descripcion: 'Torre de 15 niveles con 120 unidades residenciales',
    tipologia: 'residencial',
    tipoObra: 'nueva',
    cliente: 'Inmobiliaria Vista Hermosa S.A.',
    clienteNit: '12345678-9',
    clienteTelefono: '2222-3333',
    clienteEmail: 'contacto@vistahermosa.com.gt',
    ubicacion: 'Zona 15, Guatemala',
    direccion: 'Calzada Agua Zarca 12-34',
    ciudad: 'Guatemala',
    departamento: 'Guatemala',
    codigoPostal: '01515',
    pais: 'Guatemala',
    areaConstruccion: 25000,
    numPisos: 15,
    plazoSemanas: 104,
    ingenieroResidente: 'Ing. Roberto Mazariegos',
    supervisor: 'Ing. Jorge Arriaga',
    arquitecto: 'Arq. María López',
    numeroExpediente: 'EXP-2026-001',
    numeroLicencia: 'LIC-MUN-2026-015',
    presupuestoTotal: 45000000,
    montoContrato: 52000000,
    fechaInicio: d(-60),
    fechaFin: d(44),
    avanceFisico: 35,
    avanceFinanciero: 28,
    estado: 'ejecucion',
    etapa: 'construccion',
  });
  console.log('proyecto', proyErr?.message || 'ok');

  const presupuestoId = 'pres-vh-01';
  await supabase.from('erp_presupuestos').upsert({
    id: presupuestoId,
    proyecto_id: proyectoId,
    tipologia: 'residencial',
    renglones: JSON.stringify([
      { codigo: 'R-001', nombre: 'Cimentación', unidad: 'm2', cantidad: 1200, costoMateriales: 850000, costoManoObra: 620000, costoEquipo: 210000, totalCD: 1680000 },
      { codigo: 'R-002', nombre: 'Estructura Concreto', unidad: 'm3', cantidad: 3400, costoMateriales: 6400000, costoManoObra: 2850000, costoEquipo: 950000, totalCD: 10200000 },
      { codigo: 'R-003', nombre: 'Mampostería', unidad: 'm2', cantidad: 18500, costoMateriales: 2100000, costoManoObra: 1650000, costoEquipo: 0, totalCD: 3750000 },
    ]),
    total_calculado: 15430000,
    costo_directo_total: 13050000,
    estado: 'aprobado',
    notas: 'Presupuesto base licitación',
  });
  console.log('presupuesto ok');

  const movimientos = [
    { id: 'mov-01', tipo: 'ingreso', descripcion: 'Anticipo cliente Vista Hermosa', proyecto_id: proyectoId, categoria: 'Anticipo', monto: 15000000, costoTotal: 15000000, unidad: 'global', cantidad: 1, fecha: d(-58), proveedor: 'Inmobiliaria Vista Hermosa S.A.', factura: 'ANT-001', formaPago: 'transferencia' },
    { id: 'mov-02', tipo: 'gasto', descripcion: 'Compra de cemento y acero', proyecto_id: proyectoId, categoria: 'Materiales', monto: 4200000, costoTotal: 4200000, unidad: 'global', cantidad: 1, fecha: d(-55), proveedor: 'Cementos Progreso', factura: 'FAC-501', formaPago: 'transferencia' },
    { id: 'mov-03', tipo: 'gasto', descripcion: 'Mano de obra nivel 1-5', proyecto_id: proyectoId, categoria: 'Mano de Obra', monto: 3800000, costoTotal: 3800000, unidad: 'jornales', cantidad: 950, fecha: d(-48), proveedor: 'Constructora del Sur', formaPago: 'efectivo' },
    { id: 'mov-04', tipo: 'gasto', descripcion: 'Renta de grúa torre', proyecto_id: proyectoId, categoria: 'Equipo', monto: 650000, costoTotal: 650000, unidad: 'meses', cantidad: 3, fecha: d(-40), proveedor: 'Renta Equipo GT', factura: 'FAC-901', formaPago: 'transferencia' },
    { id: 'mov-05', tipo: 'ingreso', descripcion: 'Segundo anticipo obra gruesa', proyecto_id: proyectoId, categoria: 'Anticipo', monto: 12000000, costoTotal: 12000000, unidad: 'global', cantidad: 1, fecha: d(-20), proveedor: 'Inmobiliaria Vista Hermosa S.A.', factura: 'ANT-002', formaPago: 'transferencia' },
    { id: 'mov-06', tipo: 'gasto', descripcion: 'Mano de obra nivel 6-10', proyecto_id: proyectoId, categoria: 'Mano de Obra', monto: 4100000, costoTotal: 4100000, unidad: 'jornales', cantidad: 1025, fecha: d(-12), proveedor: 'Constructora del Sur', formaPago: 'efectivo' },
  ];
  await supabase.from('erp_movimientos').upsert(movimientos);
  console.log('movimientos ok');

  await supabase.from('erp_empleados').upsert([
    { id: 'emp-01', nombre: 'Carlos Mendez', puesto: 'Residente', salarioDiario: 650, tipo: 'planilla', activo: true, proyectoIds: [proyectoId], telefono: '5555-1001', diasTrabajados: 120 },
    { id: 'emp-02', nombre: 'Ana Gomez', puesto: 'Supervisora', salarioDiario: 550, tipo: 'planilla', activo: true, proyectoIds: [proyectoId], telefono: '5555-1002', diasTrabajados: 90 },
    { id: 'emp-03', nombre: 'Pedro Lopez', puesto: 'Maestro de Obra', salarioDiario: 420, tipo: 'destajo', activo: true, proyectoIds: [proyectoId], telefono: '5555-1003', diasTrabajados: 110 },
  ]);
  console.log('empleados ok');

  await supabase.from('erp_materiales').upsert([
    { id: 'mat-01', nombre: 'Cemento', unidad: 'sacos', stock: 3200, stockMinimo: 500, precio: 78.5, categoria: 'Materiales', proyectoIds: [proyectoId], critico: false },
    { id: 'mat-02', nombre: 'Acero #5', unidad: 'varillas', stock: 1800, stockMinimo: 400, precio: 142, categoria: 'Materiales', proyectoIds: [proyectoId], critico: false },
    { id: 'mat-03', nombre: 'Grava', unidad: 'm3', stock: 60, stockMinimo: 80, precio: 285, categoria: 'Materiales', proyectoIds: [proyectoId], critico: true },
  ]);
  console.log('materiales ok');

  await supabase.from('erp_avances').upsert([
    { id: 'av-01', proyecto_id: proyectoId, renglon_id: 'R-001', renglon_codigo: 'R-001', renglon_nombre: 'Cimentación', fecha: d(-56), avance_fisico: 5, cantidad_ejecutada: 60, unidad: 'm2', notas: 'Inicio de zapatas' },
    { id: 'av-02', proyecto_id: proyectoId, renglon_id: 'R-001', renglon_codigo: 'R-001', renglon_nombre: 'Cimentación', fecha: d(-42), avance_fisico: 18, cantidad_ejecutada: 216, unidad: 'm2', notas: 'Cimentación parcial nivel 1-3' },
    { id: 'av-03', proyecto_id: proyectoId, renglon_id: 'R-002', renglon_codigo: 'R-002', renglon_nombre: 'Estructura Concreto', fecha: d(-30), avance_fisico: 28, cantidad_ejecutada: 952, unidad: 'm3', notas: 'Columnas y vigas nivel 6-8' },
    { id: 'av-04', proyecto_id: proyectoId, renglon_id: 'R-002', renglon_codigo: 'R-002', renglon_nombre: 'Estructura Concreto', fecha: d(-14), avance_fisico: 40, cantidad_ejecutada: 1360, unidad: 'm3', notas: 'Estructura hasta nivel 10' },
    { id: 'av-05', proyecto_id: proyectoId, renglon_id: 'R-003', renglon_codigo: 'R-003', renglon_nombre: 'Mampostería', fecha: d(-7), avance_fisico: 48, cantidad_ejecutada: 8880, unidad: 'm2', notas: 'Muros interiores nivel 1-9' },
  ]);
  console.log('avances ok');

  await supabase.from('erp_seguimiento').upsert([
    { id: 'seg-01', proyecto_id: proyectoId, fecha: d(-56), avance_fisico: 5, avance_financiero: 4, costo_planeado: 520000, costo_real: 580000, valor_planeado: 500000, valor_ganado: 480000 },
    { id: 'seg-02', proyecto_id: proyectoId, fecha: d(-42), avance_fisico: 18, avance_financiero: 15, costo_planeado: 1180000, costo_real: 1250000, valor_planeado: 1120000, valor_ganado: 1080000 },
    { id: 'seg-03', proyecto_id: proyectoId, fecha: d(-30), avance_fisico: 28, avance_financiero: 23, costo_planeado: 1850000, costo_real: 1920000, valor_planeado: 1780000, valor_ganado: 1720000 },
    { id: 'seg-04', proyecto_id: proyectoId, fecha: d(-14), avance_fisico: 40, avance_financiero: 33, costo_planeado: 2420000, costo_real: 2550000, valor_planeado: 2350000, valor_ganado: 2280000 },
    { id: 'seg-05', proyecto_id: proyectoId, fecha: d(-7), avance_fisico: 48, avance_financiero: 38, costo_planeado: 2780000, costo_real: 2900000, valor_planeado: 2680000, valor_ganado: 2610000 },
    { id: 'seg-06', proyecto_id: proyectoId, fecha: d(-3), avance_fisico: 52, avance_financiero: 41, costo_planeado: 3020000, costo_real: 3150000, valor_planeado: 2920000, valor_ganado: 2840000 },
  ]);
  console.log('seguimiento ok');

  await supabase.from('erp_hitos').upsert([
    { id: 'hito-01', proyecto_id: proyectoId, nombre: 'Inicio de Obra', fecha_planificada: d(-60), fecha_real: d(-60), estado: 'completado', responsable: 'Ing. Carlos Mendez', porcentaje_avance: 100 },
    { id: 'hito-02', proyecto_id: proyectoId, nombre: 'Cimentación Terminada', fecha_planificada: d(-30), fecha_real: d(-28), estado: 'completado', responsable: 'Ing. Carlos Mendez', porcentaje_avance: 100 },
    { id: 'hito-03', proyecto_id: proyectoId, nombre: 'Estructura Nivel 10', fecha_planificada: d(-15), fecha_real: null, estado: 'en_progreso', responsable: 'Ing. Jorge Arriaga', porcentaje_avance: 65 },
  ]);
  console.log('hitos ok');

  await supabase.from('erp_riesgos').upsert([
    { id: 'riesgo-01', proyecto_id: proyectoId, categoria: 'Técnico', descripcion: 'Retraso en entrega de acero', probabilidad: 4, impacto: 4, mitigacion: 'Coordinar con proveedor y tener stock de seguridad', responsable: 'Ing. Jorge Arriaga', estado: 'abierto' },
    { id: 'riesgo-02', proyecto_id: proyectoId, categoria: 'Climático', descripcion: 'Lluvias torrenciales en temporada', probabilidad: 3, impacto: 3, mitigacion: 'Plan de cubierta temporal y bombeo', responsable: 'Ing. Carlos Mendez', estado: 'mitigado' },
  ]);
  console.log('riesgos ok');

  await supabase.from('erp_proveedores').upsert([
    { id: 'prov-01', nombre: 'Cementos Progreso', contacto: 'Luis Morales', telefono: '5555-2001', email: 'ventas@progreso.com', categoria: 'materiales', rubro: 'Materiales de Construcción', calificacion: 4 },
    { id: 'prov-02', nombre: 'Renta Equipo GT', contacto: 'Maria Castillo', telefono: '5555-2002', email: 'info@rentaequipo.gt', categoria: 'equipo', rubro: 'Renta de Maquinaria', calificacion: 4 },
  ]);
  console.log('proveedores ok');

  await supabase.from('erp_ordenes_compra').upsert([
    { id: 'oc-01', proyectoId: proyectoId, proveedor: 'Cementos Progreso', material: 'Cemento + Acero', cantidad: 150, monto: 42000000, estado: 'recibida', fecha: d(-55), items: [{ materialId: 'mat-01', cantidad: 500, precioUnitario: 78.5 }, { materialId: 'mat-02', cantidad: 120, precioUnitario: 142 }] },
  ]);
  console.log('ordenes ok');

  await supabase.from('erp_cuentas_cobrar').upsert([
    { id: 'cc-01', proyectoId: proyectoId, cliente: 'Inmobiliaria Vista Hermosa S.A.', monto: 52000000, saldo: 25000000, fechaEmision: d(-60), fechaVencimiento: d(30), estado: 'parcial', factura: 'FAC-001-2026' },
  ]);
  console.log('cuentas_cobrar ok');

  await supabase.from('erp_cuentas_pagar').upsert([
    { id: 'cp-01', proyectoId: proyectoId, proveedor: 'Cementos Progreso', monto: 42000000, saldo: 12000000, fechaEmision: d(-55), fechaVencimiento: d(-20), estado: 'parcial', factura: 'FAC-501' },
  ]);
  console.log('cuentas_pagar ok');

  await supabase.from('erp_bitacora').upsert([
    { id: 'bit-01', proyecto_id: proyectoId, fecha: d(-50), clima: 'soleado', personal_presente: 45, maquinaria: 'Grúa torre, concretera', tareas: 'Colado columna nivel 3-5', observaciones: 'Sin incidencias', fotos: [], lat: 14.6032, lng: -90.5153 },
    { id: 'bit-02', proyecto_id: proyectoId, fecha: d(-30), clima: 'nublado', personal_presente: 60, maquinaria: 'Grúa torre, vibrador', tareas: 'Colado losa nivel 6-8', observaciones: 'Llovizna ligera', fotos: [], lat: 14.6032, lng: -90.5153 },
  ]);
  console.log('bitacora ok');

  await supabase.from('erp_eventos_calendario').upsert([
    { id: 'ev-01', proyecto_id: proyectoId, titulo: 'Revisión de estructura nivel 8', fecha: d(-28), hora: '09:00', tipo: 'reunion', participantes: ['Carlos Mendez', 'Ana Gomez'], descripcion: 'Inspección previa a colado', completado: true },
    { id: 'ev-02', proyecto_id: proyectoId, titulo: 'Entrega acero estructural', fecha: d(-24), hora: '14:00', tipo: 'entrega', participantes: ['Jorge Arriaga'], descripcion: 'Llegada de 120 varillas', completado: true },
    { id: 'ev-03', proyecto_id: proyectoId, titulo: 'Pago anticipo 2', fecha: d(-20), hora: '10:00', tipo: 'pago', participantes: ['Maria Lopez'], descripcion: 'Transferencia por Q12,000,000', completado: true },
  ]);
  console.log('eventos ok');

  await supabase.from('erp_publicaciones_muro').upsert([
    { id: 'pub-01', proyecto_id: proyectoId, autor: 'Ing. Carlos Mendez', contenido: 'Avance del 40% en estructura. Siguiente hito: losa nivel 12.', fecha: d(-14), likes: 5, adjuntos: [] },
  ]);
  console.log('publicaciones ok');

  console.log('seed completo');
}

seed().catch(err => {
  console.error('seed falló:', err);
  process.exit(1);
});
