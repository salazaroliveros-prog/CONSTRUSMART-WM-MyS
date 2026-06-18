import { RenglonBase, Tipologia, Insumo, Proyecto, Movimiento, Empleado, Material, OrdenCompra, Proveedor } from './types';

interface BaseDef {
  nombre: string;
  unidad: string;
  rend: number; // rendimiento cuadrilla/dia
  mat: number;  // costo materiales unitario
  mo: number;   // costo mano de obra unitario
  eq: number;   // costo equipo unitario
}

// 45 renglones en orden cronológico de obra (Guatemala)
const BASE: BaseDef[] = [
  { nombre: 'Limpieza y chapeo de terreno', unidad: 'm²', rend: 200, mat: 2, mo: 6, eq: 1 },
  { nombre: 'Trazo y estaqueado', unidad: 'm²', rend: 150, mat: 4, mo: 8, eq: 0.5 },
  { nombre: 'Demolición de estructuras existentes', unidad: 'm³', rend: 8, mat: 0, mo: 120, eq: 80 },
  { nombre: 'Excavación de cimientos', unidad: 'm³', rend: 6, mat: 0, mo: 90, eq: 40 },
  { nombre: 'Relleno y compactación', unidad: 'm³', rend: 12, mat: 25, mo: 60, eq: 35 },
  { nombre: 'Solera de humedad', unidad: 'ml', rend: 25, mat: 85, mo: 45, eq: 8 },
  { nombre: 'Cimiento corrido de concreto', unidad: 'm³', rend: 3, mat: 950, mo: 280, eq: 60 },
  { nombre: 'Zapatas aisladas', unidad: 'm³', rend: 2.5, mat: 1050, mo: 320, eq: 70 },
  { nombre: 'Columnas de concreto reforzado', unidad: 'm³', rend: 1.5, mat: 1250, mo: 480, eq: 90 },
  { nombre: 'Vigas y soleras de concreto', unidad: 'm³', rend: 1.8, mat: 1180, mo: 420, eq: 85 },
  { nombre: 'Levantado de muro block 0.15', unidad: 'm²', rend: 14, mat: 95, mo: 55, eq: 6 },
  { nombre: 'Levantado de muro block 0.20', unidad: 'm²', rend: 11, mat: 125, mo: 68, eq: 7 },
  { nombre: 'Tabique de tablayeso', unidad: 'm²', rend: 18, mat: 110, mo: 60, eq: 5 },
  { nombre: 'Losa de entrepiso tradicional', unidad: 'm²', rend: 8, mat: 320, mo: 145, eq: 25 },
  { nombre: 'Losa de techo prefabricada', unidad: 'm²', rend: 20, mat: 285, mo: 90, eq: 18 },
  { nombre: 'Estructura metálica de techo', unidad: 'kg', rend: 120, mat: 14, mo: 6, eq: 2 },
  { nombre: 'Cubierta de lámina', unidad: 'm²', rend: 35, mat: 145, mo: 40, eq: 8 },
  { nombre: 'Instalación de agua potable', unidad: 'pto', rend: 8, mat: 165, mo: 120, eq: 10 },
  { nombre: 'Instalación de drenajes', unidad: 'pto', rend: 6, mat: 220, mo: 150, eq: 12 },
  { nombre: 'Instalación eléctrica', unidad: 'pto', rend: 10, mat: 185, mo: 110, eq: 8 },
  { nombre: 'Tablero y acometida eléctrica', unidad: 'u', rend: 1, mat: 2800, mo: 850, eq: 50 },
  { nombre: 'Instalación de voz y datos', unidad: 'pto', rend: 12, mat: 145, mo: 95, eq: 6 },
  { nombre: 'Repello de muros', unidad: 'm²', rend: 22, mat: 35, mo: 42, eq: 4 },
  { nombre: 'Cernido fino', unidad: 'm²', rend: 25, mat: 28, mo: 38, eq: 3 },
  { nombre: 'Alisado de cielo', unidad: 'm²', rend: 18, mat: 32, mo: 48, eq: 4 },
  { nombre: 'Piso cerámico', unidad: 'm²', rend: 16, mat: 135, mo: 65, eq: 6 },
  { nombre: 'Piso de porcelanato', unidad: 'm²', rend: 12, mat: 245, mo: 85, eq: 8 },
  { nombre: 'Piso de concreto pulido', unidad: 'm²', rend: 30, mat: 95, mo: 55, eq: 15 },
  { nombre: 'Azulejo en baños', unidad: 'm²', rend: 14, mat: 155, mo: 70, eq: 6 },
  { nombre: 'Puertas de madera', unidad: 'u', rend: 4, mat: 1450, mo: 280, eq: 20 },
  { nombre: 'Ventanería de aluminio y vidrio', unidad: 'm²', rend: 8, mat: 685, mo: 145, eq: 15 },
  { nombre: 'Portón metálico', unidad: 'm²', rend: 5, mat: 850, mo: 220, eq: 30 },
  { nombre: 'Pintura interior', unidad: 'm²', rend: 40, mat: 28, mo: 22, eq: 3 },
  { nombre: 'Pintura exterior', unidad: 'm²', rend: 35, mat: 38, mo: 28, eq: 4 },
  { nombre: 'Artefactos sanitarios', unidad: 'u', rend: 3, mat: 1250, mo: 320, eq: 20 },
  { nombre: 'Grifería y accesorios', unidad: 'u', rend: 8, mat: 485, mo: 120, eq: 8 },
  { nombre: 'Muebles de cocina', unidad: 'ml', rend: 2, mat: 2400, mo: 480, eq: 40 },
  { nombre: 'Closets y muebles fijos', unidad: 'ml', rend: 1.5, mat: 1850, mo: 420, eq: 35 },
  { nombre: 'Jardinería y áreas verdes', unidad: 'm²', rend: 50, mat: 65, mo: 45, eq: 10 },
  { nombre: 'Pavimento adoquinado', unidad: 'm²', rend: 25, mat: 185, mo: 75, eq: 25 },
  { nombre: 'Muro perimetral', unidad: 'ml', rend: 6, mat: 485, mo: 180, eq: 20 },
  { nombre: 'Sistema contra incendios', unidad: 'pto', rend: 4, mat: 850, mo: 280, eq: 40 },
  { nombre: 'Climatización HVAC', unidad: 'u', rend: 1, mat: 8500, mo: 1200, eq: 200 },
  { nombre: 'Impermeabilización de losa', unidad: 'm²', rend: 30, mat: 85, mo: 45, eq: 8 },
  { nombre: 'Limpieza final de obra', unidad: 'm²', rend: 120, mat: 8, mo: 12, eq: 2 },
];

// Multiplicadores por tipología (ajustan costos y rendimientos)
const FACTOR: Record<Tipologia, { costo: number; rend: number }> = {
  residencial: { costo: 1.0, rend: 1.0 },
  comercial: { costo: 1.15, rend: 0.95 },
  industrial: { costo: 1.35, rend: 0.85 },
  civil: { costo: 1.25, rend: 1.1 },
  publica: { costo: 1.2, rend: 0.9 },
};

const makeInsumos = (codigo: string, mat: number, mo: number, eq: number): Insumo[] => {
  const list: Insumo[] = [];
  if (mat > 0) {
    list.push({ id: codigo + '-m1', nombre: 'Material principal', tipo: 'material', unidad: 'u', precio: +(mat * 0.65).toFixed(2), rendimiento: 1 });
    list.push({ id: codigo + '-m2', nombre: 'Material secundario / consumibles', tipo: 'material', unidad: 'u', precio: +(mat * 0.35).toFixed(2), rendimiento: 1 });
  }
  if (mo > 0) {
    list.push({ id: codigo + '-mo1', nombre: 'Albañil (mano de obra)', tipo: 'mano_obra', unidad: 'jornal', precio: +(mo * 0.6).toFixed(2), rendimiento: 1 });
    list.push({ id: codigo + '-mo2', nombre: 'Ayudante (mano de obra)', tipo: 'mano_obra', unidad: 'jornal', precio: +(mo * 0.4).toFixed(2), rendimiento: 1 });
  }
  if (eq > 0) {
    list.push({ id: codigo + '-eq1', nombre: 'Equipo y maquinaria', tipo: 'equipo', unidad: 'hora', precio: +eq.toFixed(2), rendimiento: 1 });
  }
  return list;
};

export const generarRenglones = (tipologia: Tipologia): RenglonBase[] => {
  const f = FACTOR[tipologia];
  return BASE.map((b, i) => {
    const codigo = `${tipologia.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
    const mat = +(b.mat * f.costo).toFixed(2);
    const mo = +(b.mo * f.costo).toFixed(2);
    const eq = +(b.eq * f.costo).toFixed(2);
    return {
      codigo,
      nombre: b.nombre,
      unidad: b.unidad,
      tipologia,
      rendimientoCuadrilla: +(b.rend * f.rend).toFixed(1),
      costoMateriales: mat,
      costoManoObra: mo,
      costoEquipo: eq,
      insumos: makeInsumos(codigo, mat, mo, eq),
    };
  });
};

// ===== SEED DATA =====
export const SEED_PROYECTOS: Proyecto[] = [
  { id: 'p1', nombre: 'Residencial Las Cumbres', cliente: 'Inversiones GT', ubicacion: 'Ciudad de Guatemala', tipologia: 'residencial', estado: 'ejecucion', presupuestoTotal: 4850000, montoContrato: 5800000, avanceFisico: 62, avanceFinanciero: 58, lat: 14.6349, lng: -90.5069, fechaInicio: '2026-01-15', fechaFin: '2026-09-30' },
  { id: 'p2', nombre: 'Centro Comercial Plaza Norte', cliente: 'Grupo Comercial SA', ubicacion: 'Mixco', tipologia: 'comercial', estado: 'ejecucion', presupuestoTotal: 12500000, montoContrato: 14800000, avanceFisico: 45, avanceFinanciero: 52, lat: 14.6133, lng: -90.6064, fechaInicio: '2025-11-01', fechaFin: '2026-12-15' },
  { id: 'p3', nombre: 'Planta Industrial Amatitlán', cliente: 'Manufacturas del Sur', ubicacion: 'Amatitlán', tipologia: 'industrial', estado: 'ejecucion', presupuestoTotal: 8900000, montoContrato: 10200000, avanceFisico: 30, avanceFinanciero: 38, lat: 14.4769, lng: -90.6164, fechaInicio: '2026-02-10', fechaFin: '2026-11-20' },
  { id: 'p4', nombre: 'Puente Vehicular Río Las Vacas', cliente: 'Municipalidad', ubicacion: 'Chinautla', tipologia: 'civil', estado: 'ejecucion', presupuestoTotal: 6200000, montoContrato: 7100000, avanceFisico: 78, avanceFinanciero: 72, lat: 14.6850, lng: -90.5000, fechaInicio: '2025-09-01', fechaFin: '2026-07-30' },
  { id: 'p5', nombre: 'Escuela Pública Zona 18', cliente: 'MINEDUC', ubicacion: 'Guatemala Z.18', tipologia: 'publica', estado: 'ejecucion', presupuestoTotal: 3100000, montoContrato: 3450000, avanceFisico: 88, avanceFinanciero: 85, lat: 14.6700, lng: -90.4800, fechaInicio: '2025-08-15', fechaFin: '2026-06-30' },
  { id: 'p6', nombre: 'Condominio Villas del Lago', cliente: 'Desarrolladora Lago', ubicacion: 'Santa Catarina Pinula', tipologia: 'residencial', estado: 'planeacion', presupuestoTotal: 9500000, montoContrato: 11200000, avanceFisico: 0, avanceFinanciero: 5, lat: 14.5700, lng: -90.4960, fechaInicio: '2026-07-01', fechaFin: '2027-08-30' },
  { id: 'p7', nombre: 'Bodega Logística CA-9', cliente: 'Transportes Unidos', ubicacion: 'Villa Nueva', tipologia: 'industrial', estado: 'planeacion', presupuestoTotal: 5400000, montoContrato: 6100000, avanceFisico: 0, avanceFinanciero: 0, lat: 14.5260, lng: -90.5870, fechaInicio: '2026-08-15', fechaFin: '2027-05-30' },
  { id: 'p8', nombre: 'Remodelación Edificio Centro', cliente: 'Banco Regional', ubicacion: 'Guatemala Z.1', tipologia: 'comercial', estado: 'planeacion', presupuestoTotal: 2800000, montoContrato: 3300000, avanceFisico: 0, avanceFinanciero: 8, lat: 14.6420, lng: -90.5130, fechaInicio: '2026-06-20', fechaFin: '2026-12-20' },
];

export const SEED_MOVIMIENTOS: Movimiento[] = [
  { id: 'm1', tipo: 'ingreso', proyectoId: 'p1', descripcion: 'Estimación #3 cobrada', cantidad: 1, unidad: 'global', categoria: 'aporte', costoUnitario: 980000, costoTotal: 980000, fecha: '2026-05-10' },
  { id: 'm2', tipo: 'gasto', proyectoId: 'p1', descripcion: 'Compra de cemento', cantidad: 850, unidad: 'saco', categoria: 'materiales', costoUnitario: 92, costoTotal: 78200, fecha: '2026-05-12' },
  { id: 'm3', tipo: 'gasto', proyectoId: 'p2', descripcion: 'Planilla semanal', cantidad: 1, unidad: 'global', categoria: 'mano_obra', costoUnitario: 145000, costoTotal: 145000, fecha: '2026-05-15' },
  { id: 'm4', tipo: 'ingreso', proyectoId: 'p4', descripcion: 'Valuación municipal', cantidad: 1, unidad: 'global', categoria: 'aporte', costoUnitario: 620000, costoTotal: 620000, fecha: '2026-05-18' },
  { id: 'm5', tipo: 'gasto', proyectoId: null, descripcion: 'Renta de oficina', cantidad: 1, unidad: 'mes', categoria: 'fijos', costoUnitario: 12000, costoTotal: 12000, fecha: '2026-05-01' },
  { id: 'm6', tipo: 'gasto', proyectoId: null, descripcion: 'Gastos personales hogar', cantidad: 1, unidad: 'mes', categoria: 'hogar', costoUnitario: 8500, costoTotal: 8500, fecha: '2026-05-02' },
  { id: 'm7', tipo: 'gasto', proyectoId: 'p3', descripcion: 'Subcontrato estructura metálica', cantidad: 1, unidad: 'global', categoria: 'sub_contrato', costoUnitario: 320000, costoTotal: 320000, fecha: '2026-05-20' },
  { id: 'm8', tipo: 'gasto', proyectoId: null, descripcion: 'Combustible flotilla', cantidad: 1, unidad: 'mes', categoria: 'transporte', costoUnitario: 9800, costoTotal: 9800, fecha: '2026-05-08' },
];

export const SEED_EMPLEADOS: Empleado[] = [
  { id: 'e1', nombre: 'Carlos Méndez', puesto: 'Maestro de obra', proyectoId: 'p1', salarioDiario: 175, diasTrabajados: 26, tipo: 'planilla' },
  { id: 'e2', nombre: 'José Ramírez', puesto: 'Albañil', proyectoId: 'p1', salarioDiario: 130, diasTrabajados: 24, tipo: 'destajo' },
  { id: 'e3', nombre: 'Luis García', puesto: 'Armador', proyectoId: 'p2', salarioDiario: 140, diasTrabajados: 25, tipo: 'planilla' },
  { id: 'e4', nombre: 'Ana López', puesto: 'Ing. Residente', proyectoId: 'p3', salarioDiario: 380, diasTrabajados: 26, tipo: 'planilla' },
  { id: 'e5', nombre: 'Pedro Cux', puesto: 'Ayudante', proyectoId: 'p4', salarioDiario: 95, diasTrabajados: 23, tipo: 'destajo' },
  { id: 'e6', nombre: 'Marvin Tzoc', puesto: 'Operador', proyectoId: 'p2', salarioDiario: 165, diasTrabajados: 26, tipo: 'planilla' },
  { id: 'e7', nombre: 'Sandra Pérez', puesto: 'Bodeguero', proyectoId: 'p1', salarioDiario: 120, diasTrabajados: 26, tipo: 'planilla' },
];

export const SEED_MATERIALES: Material[] = [
  { id: 'mt1', nombre: 'Cemento UGC 42.5 kg', unidad: 'saco', stock: 120, stockMinimo: 200, precio: 92, critico: true },
  { id: 'mt2', nombre: 'Hierro 3/8" grado 40', unidad: 'qq', stock: 45, stockMinimo: 60, precio: 285, critico: true },
  { id: 'mt3', nombre: 'Block 0.15x0.20x0.40', unidad: 'u', stock: 3200, stockMinimo: 1500, precio: 5.5, critico: false },
  { id: 'mt4', nombre: 'Arena de río', unidad: 'm³', stock: 18, stockMinimo: 10, precio: 145, critico: false },
  { id: 'mt5', nombre: 'Piedrín 3/4"', unidad: 'm³', stock: 8, stockMinimo: 12, precio: 195, critico: true },
  { id: 'mt6', nombre: 'Cal hidratada', unidad: 'saco', stock: 60, stockMinimo: 40, precio: 48, critico: false },
  { id: 'mt7', nombre: 'Alambre de amarre', unidad: 'qq', stock: 6, stockMinimo: 5, precio: 320, critico: false },
  { id: 'mt8', nombre: 'Lámina galvanizada cal.28', unidad: 'u', stock: 25, stockMinimo: 30, precio: 165, critico: true },
];

export const SEED_OC: OrdenCompra[] = [
  { id: 'oc1', proveedor: 'Cementos Progreso', material: 'Cemento UGC', cantidad: 300, monto: 27600, estado: 'pendiente', fecha: '2026-05-28' },
  { id: 'oc2', proveedor: 'Aceros de Guatemala', material: 'Hierro 3/8"', cantidad: 50, monto: 14250, estado: 'pendiente', fecha: '2026-05-29' },
  { id: 'oc3', proveedor: 'Agregados del Sur', material: 'Piedrín 3/4"', cantidad: 20, monto: 3900, estado: 'aprobado', fecha: '2026-05-25' },
  { id: 'oc4', proveedor: 'Distribuidora Láminas', material: 'Lámina cal.28', cantidad: 40, monto: 6600, estado: 'pendiente', fecha: '2026-05-30' },
];

export const SEED_PROVEEDORES: Proveedor[] = [
  { id: 'pr1', nombre: 'Cementos Progreso', contacto: '2222-3344', rubro: 'Cemento y agregados', calificacion: 5 },
  { id: 'pr2', nombre: 'Aceros de Guatemala', contacto: '2255-6677', rubro: 'Acero estructural', calificacion: 4 },
  { id: 'pr3', nombre: 'Agregados del Sur', contacto: '2266-7788', rubro: 'Arena y piedrín', calificacion: 4 },
  { id: 'pr4', nombre: 'Distribuidora Láminas', contacto: '2277-8899', rubro: 'Techos y láminas', calificacion: 3 },
  { id: 'pr5', nombre: 'Ferretería Central', contacto: '2288-9900', rubro: 'Ferretería general', calificacion: 5 },
];
