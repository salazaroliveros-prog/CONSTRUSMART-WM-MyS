import { createClient } from '@supabase/supabase-js'

const s = createClient(
  'https://neygzluxugodiwcuctbj.supabase.co',
  'SERVICE_ROLE_KEY_REVOKED'
)

const P = 'a1b2c3d4-1111-4111-8111-111111111111'
const P2 = 'b2c3d4e5-2222-4222-8222-222222222222'

async function ins(table, data) {
  const { error } = await s.from(table).insert(data)
  if (error) console.log(`  ${table}: ${error.message}`)
  else console.log(`  ${table}: ${data.length || 1} OK`)
}

console.log('=== SEED CONSTRUSMART ERP ===\n')

console.log('1. Proyectos...')
await ins('erp_proyectos', [
  { id: P, nombre: 'Centro Comercial Plaza Norte', cliente: 'Grupo Inmobiliario Centro', ubicacion: 'Zona 10, Guatemala', tipologia: 'comercial', estado: 'ejecucion', presupuesto_total: 45000000, monto_contrato: 42000000, avance_fisico: 35, avance_financiero: 28, fecha_inicio: '2025-01-15', fecha_fin: '2026-06-30', created_by: null, descripcion: 'Centro comercial 3 niveles con 120 locales', tipo_obra: 'nueva', ciudad: 'Guatemala', departamento: 'Guatemala', pais: 'Guatemala', area_construccion: 15000, num_pisos: 3, plazo_semanas: 78, ingeniero_residente: 'Ing. Carlos Mendez', supervisor: 'Ing. Ana Luisa Torres', moneda: 'GTQ' },
  { id: P2, nombre: 'Torre Residencial Vista Verde', cliente: 'Constructora Vista Verde SA', ubicacion: 'Zona 14, Guatemala', tipologia: 'residencial', estado: 'planeacion', presupuesto_total: 28000000, monto_contrato: 26500000, avance_fisico: 0, avance_financiero: 0, fecha_inicio: '2026-02-01', fecha_fin: '2027-08-15', created_by: null, descripcion: 'Torre residencial 12 pisos con 48 apartamentos', tipo_obra: 'nueva', ciudad: 'Guatemala', departamento: 'Guatemala', pais: 'Guatemala', area_construccion: 8500, num_pisos: 12, plazo_semanas: 80, moneda: 'GTQ' },
  { id: 'c3d4e5f6-3333-4333-8333-333333333333', nombre: 'Edificio Corporativo San Cristobal', cliente: 'Grupo Constructor SC', ubicacion: 'Zona 13, Guatemala', tipologia: 'industrial', estado: 'ejecucion', presupuesto_total: 18000000, monto_contrato: 17200000, avance_fisico: 45, avance_financiero: 40, fecha_inicio: '2025-03-01', fecha_fin: '2026-03-30', created_by: null, descripcion: 'Edificio corporativo oficinas y bodega', tipo_obra: 'nueva', ciudad: 'Guatemala', departamento: 'Guatemala', pais: 'Guatemala', area_construccion: 4200, num_pisos: 4, plazo_semanas: 55, moneda: 'GTQ' }
])

console.log('2. Empleados...')
await ins('erp_empleados', [
  { id: crypto.randomUUID(), nombre: 'Carlos Mendez', puesto: 'Ingeniero Residente', proyecto_id: P, salario_diario: 327, dias_trabajados: 120, tipo: 'planilla' },
  { id: crypto.randomUUID(), nombre: 'Ana Luisa Torres', puesto: 'Supervisora', proyecto_id: P, salario_diario: 277, dias_trabajados: 100, tipo: 'planilla' },
  { id: crypto.randomUUID(), nombre: 'Roberto Diaz', puesto: 'Arquitecto', proyecto_id: P, salario_diario: 346, dias_trabajados: 90, tipo: 'planilla' },
  { id: crypto.randomUUID(), nombre: 'Maria Elena Gonzalez', puesto: 'Ingeniero Residente', proyecto_id: P, salario_diario: 354, dias_trabajados: 85, tipo: 'planilla' },
  { id: crypto.randomUUID(), nombre: 'Pedro Alvarez', puesto: 'Gerente de Obra', proyecto_id: P2, salario_diario: 462, dias_trabajados: 60, tipo: 'planilla' },
  { id: crypto.randomUUID(), nombre: 'Juan Perez', puesto: 'Supervisor', proyecto_id: P, salario_diario: 250, dias_trabajados: 110, tipo: 'destajo' }
])

console.log('3. Proveedores...')
await ins('erp_proveedores', [
  { id: crypto.randomUUID(), nombre: 'ConstruAcero SA', contacto: 'Roberto Martinez', rubro: 'Acero y metales', calificacion: 4 },
  { id: crypto.randomUUID(), nombre: 'Cemento Progreso', contacto: 'Maria Lopez', rubro: 'Material de construccion', calificacion: 5 },
  { id: crypto.randomUUID(), nombre: 'Herramientas GT', contacto: 'Carlos Ruiz', rubro: 'Herramientas', calificacion: 3 }
])

console.log('4. Materiales...')
await ins('erp_materiales', [
  { id: crypto.randomUUID(), nombre: 'Cemento Portland', unidad: 'sacos', stock: 500, stock_minimo: 100, precio: 180, critico: false, created_by: null },
  { id: crypto.randomUUID(), nombre: 'Acero #5', unidad: 'varillas', stock: 200, stock_minimo: 50, precio: 145, critico: true, created_by: null },
  { id: crypto.randomUUID(), nombre: 'Grava', unidad: 'm3', stock: 100, stock_minimo: 30, precio: 95, critico: false, created_by: null },
  { id: crypto.randomUUID(), nombre: 'Arena', unidad: 'm3', stock: 80, stock_minimo: 25, precio: 85, critico: false, created_by: null },
  { id: crypto.randomUUID(), nombre: 'Bloques de concreto', unidad: 'unidades', stock: 5000, stock_minimo: 1000, precio: 4.5, critico: false, created_by: null },
  { id: crypto.randomUUID(), nombre: 'Hierro #4', unidad: 'varillas', stock: 150, stock_minimo: 40, precio: 120, critico: true, created_by: null }
])

console.log('5. Avances...')
const avances = []
for (let w = 1; w <= 8; w++) {
  const vf = Math.min(w * 4.5, 35)
  const vp = Math.max(w * 5 - 2, 0)
  avances.push({
    id: crypto.randomUUID(),
    proyecto_id: P,
    fecha: new Date(2025, 0, 15 + w * 7).toISOString().split('T')[0],
    avance_fisico: vf,
    cantidad_ejecutada: vp
  })
}
await ins('erp_avances', avances)

console.log('6. Muro...')
await ins('erp_muro', [
  { id: crypto.randomUUID(), proyecto_id: P, autor: 'Ing. Carlos Mendez', contenido: 'Avance estructura nivel 1 completada exitosamente. Se inicia nivel 2.', tipo: 'publicacion', created_by: null, likes: 3 },
  { id: crypto.randomUUID(), proyecto_id: P, autor: 'Ing. Ana Luisa Torres', contenido: 'Reunion de coordinacion con proveedores de acero. Entrega programada para viernes.', tipo: 'aviso', created_by: null, likes: 2 },
  { id: crypto.randomUUID(), proyecto_id: P, autor: 'Ing. Carlos Mendez', contenido: 'Inspeccion de calidad de concreto en planta. Todo aprobado.', tipo: 'publicacion', created_by: null, likes: 5 }
])

console.log('7. Bitacora...')
await ins('erp_bitacora', [
  { id: crypto.randomUUID(), proyecto_id: P, fecha: '2025-01-15', clima: 'Soleado', personal: 15, maquinaria: 'Excavadora, Compactadora', tareas: 'Inicio de obra, limpieza del terreno', observaciones: 'Terreno listo para inicio' },
  { id: crypto.randomUUID(), proyecto_id: P, fecha: '2025-04-30', clima: 'Nublado', personal: 25, maquinaria: 'Mezcladora, Vibrador', tareas: 'Colado de zapatas y contrazapatas', observaciones: 'Cimentacion completada' },
  { id: crypto.randomUUID(), proyecto_id: P, fecha: '2025-08-15', clima: 'Lluvioso', personal: 20, maquinaria: 'Grúa, Mezcladora', tareas: 'Colado de losa nivel 1', observaciones: 'Estructura nivel 1 completada' }
])

console.log('8. Hitos...')
await ins('erp_hitos', [
  { id: crypto.randomUUID(), proyecto_id: P, nombre: 'Inicio de obra', descripcion: 'Fecha de inicio formal', fecha: '2025-01-15', tipo: 'hito', estado: 'completado', responsable: 'Ing. Carlos Mendez' },
  { id: crypto.randomUUID(), proyecto_id: P, nombre: 'Cimentacion terminada', descripcion: 'Finalizacion de zapatas', fecha: '2025-04-30', tipo: 'entregable', estado: 'completado', responsable: 'Ing. Carlos Mendez' },
  { id: crypto.randomUUID(), proyecto_id: P, nombre: 'Estructura nivel 1', descripcion: 'Colado de losa nivel 1', fecha: '2025-08-15', tipo: 'entregable', estado: 'completado', responsable: 'Ing. Ana Luisa Torres' },
  { id: crypto.randomUUID(), proyecto_id: P, nombre: 'Pago avance 30%', descripcion: 'Pago por avance del 30%', fecha: '2025-10-15', tipo: 'pago', estado: 'pendiente', responsable: 'Gerencia' },
  { id: crypto.randomUUID(), proyecto_id: P, nombre: 'Acabados', descripcion: 'Instalaciones y acabados', fecha: '2026-03-15', tipo: 'entregable', estado: 'pendiente', responsable: 'Ing. Carlos Mendez' },
  { id: crypto.randomUUID(), proyecto_id: P, nombre: 'Entrega final', descripcion: 'Entrega al cliente', fecha: '2026-06-30', tipo: 'administrativo', estado: 'pendiente', responsable: 'Gerencia' }
])

console.log('9. Cuentas por Cobrar...')
await ins('erp_cuentas_cobrar', [
  { id: crypto.randomUUID(), proyecto_id: P, cliente: 'Grupo Inmobiliario Centro', concepto: 'Avance obra 35%', monto: 14700000, saldo_pendiente: 14700000, fecha_emision: '2025-09-01', fecha_vencimiento: '2025-10-01', estado: 'pendiente' },
  { id: crypto.randomUUID(), proyecto_id: P, cliente: 'Grupo Inmobiliario Centro', concepto: 'Avance obra 20%', monto: 8400000, saldo_pendiente: 0, fecha_emision: '2025-06-01', fecha_vencimiento: '2025-07-01', estado: 'pagada' }
])

console.log('10. Cuentas por Pagar...')
await ins('erp_cuentas_pagar', [
  { id: crypto.randomUUID(), proyecto_id: P, proveedor: 'ConstruAcero SA', concepto: 'Factura acero #5', monto: 2850000, saldo_pendiente: 2850000, fecha_emision: '2025-08-15', fecha_vencimiento: '2025-09-15', estado: 'pendiente' },
  { id: crypto.randomUUID(), proyecto_id: P, proveedor: 'Cemento Progreso', concepto: 'Factura cemento Portland', monto: 1260000, saldo_pendiente: 0, fecha_emision: '2025-05-01', fecha_vencimiento: '2025-06-01', estado: 'pagada' }
])

console.log('11. Ordenes de Cambio...')
await ins('erp_ordenes_cambio', [
  { id: crypto.randomUUID(), proyecto_id: P, titulo: 'Ampliacion parqueo', descripcion: 'Ampliar area de parqueo en 50m2', impacto_costo: 1450000, impacto_plazo: 15, estado: 'solicitada', solicitante: 'Arq. Roberto Diaz', solicitante_rol: 'Arquitecto' },
  { id: crypto.randomUUID(), proyecto_id: P, titulo: 'Cambio piso lobby', descripcion: 'Cambiar especificacion de piso del lobby', impacto_costo: 320000, impacto_plazo: 5, estado: 'aprobada', solicitante: 'Cliente', solicitante_rol: 'Cliente' }
])

console.log('12. Incidentes...')
await ins('erp_incidentes', [
  { id: crypto.randomUUID(), proyecto_id: P, tipo: 'accidente', fecha: '2025-05-15', descripcion: 'Golpe con herramienta en mano derecha', afectados: '1 trabajador', reportado_por: 'Supervisor Juan Perez', estado: 'cerrado' },
  { id: crypto.randomUUID(), proyecto_id: P, tipo: 'condicion_insegura', fecha: '2025-07-20', descripcion: 'Baranda de proteccion danada en nivel 2', afectados: 'Zona general', reportado_por: 'Ing. Ana Luisa Torres', estado: 'investigacion' }
])

console.log('13. Riesgos...')
await ins('erp_riesgos', [
  { id: crypto.randomUUID(), proyecto_id: P, nombre: 'Retraso en entrega de acero', descripcion: 'Proveedor principal con demoras', tipo: 'tecnico', probabilidad: 3, impacto: 4, plan_mitigacion: 'Buscar proveedor alterno', responsable: 'Ing. Carlos Mendez', estado: 'identificado', fecha_identificacion: '2025-01-20' },
  { id: crypto.randomUUID(), proyecto_id: P, nombre: 'Incremento precio cemento', descripcion: 'Posible aumento de 15% en precio', tipo: 'financiero', probabilidad: 2, impacto: 3, plan_mitigacion: 'Compra anticipada', responsable: 'Gerencia', estado: 'mitigado', fecha_identificacion: '2025-02-10' }
])

console.log('14. No Conformidades...')
await ins('erp_no_conformidades', [
  { id: crypto.randomUUID(), proyecto_id: P, codigo: 'NC-001', descripcion: 'Acero con separacion mayor a la especificada', categoria: 'calidad', detectado_por: 'Supervisor Juan Perez', fecha_deteccion: '2025-05-10', estado: 'abierta' },
  { id: crypto.randomUUID(), proyecto_id: P, codigo: 'NC-002', descripcion: 'Falla en procion de concreto', categoria: 'calidad', detectado_por: 'Ing. Ana Luisa Torres', fecha_deteccion: '2025-06-15', plan_accion: 'Reforzar controles de calidad', estado: 'en_proceso' }
])

console.log('15. Ordenes de Compra...')
await ins('erp_ordenes_compra', [
  { id: crypto.randomUUID(), proveedor: 'ConstruAcero SA', material: 'Acero #5', cantidad: 200, monto: 2900000, items: [{ material: 'Acero #5', cantidad: 200, precio: 145 }], estado: 'aprobado', fecha: '2025-08-01' },
  { id: crypto.randomUUID(), proveedor: 'Cemento Progreso', material: 'Cemento Portland', cantidad: 700, monto: 1260000, items: [{ material: 'Cemento', cantidad: 700, precio: 180 }], estado: 'recibida', fecha: '2025-04-15' }
])

console.log('16. Rendimientos Cuadrilla...')
await ins('erp_rendimientos_cuadrilla', [
  { id: crypto.randomUUID(), actividad: 'Excavacion manual', cuadrilla: 'Cuadrilla A', rendimiento_diario: 4.5, unidad: 'm3' },
  { id: crypto.randomUUID(), actividad: 'Colado de concreto', cuadrilla: 'Cuadrilla B', rendimiento_diario: 12, unidad: 'm3' },
  { id: crypto.randomUUID(), actividad: 'Instalacion de acero', cuadrilla: 'Cuadrilla C', rendimiento_diario: 200, unidad: 'kg' }
])

console.log('10. Notificaciones...')
await ins('erp_notificaciones', [
  { id: crypto.randomUUID(), tipo: 'avance_registrado', titulo: 'Avance 35%', mensaje: 'Proyecto Centro Comercial Plaza Norte al 35% de avance fisico', proyecto_id: P },
  { id: crypto.randomUUID(), tipo: 'material_critico', titulo: 'Material Critico', mensaje: 'Acero #5 por debajo del stock minimo', proyecto_id: P }
])

console.log('\n=== RESUMEN ===')
const tabs = ['erp_proyectos', 'erp_empleados', 'erp_proveedores', 'erp_materiales', 'erp_avances', 'erp_seguimiento_evm', 'erp_muro', 'erp_cotizaciones_negocio', 'erp_bitacora', 'erp_notificaciones']
let total = 0
for (const t of tabs) {
  const { count } = await s.from(t).select('*', { count: 'exact', head: true })
  const n = count || 0
  total += n
  if (n > 0) console.log(`  ${t}: ${n}`)
}
console.log(`  TOTAL: ${total}`)
console.log('\n✅ Seed completado exitosamente')