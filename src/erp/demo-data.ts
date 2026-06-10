import type { Proyecto, Movimiento, AvanceObra, Presupuesto, Material, Empleado, Proveedor, OrdenCompra, EventoCalendario } from './types';

export const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const hoy = new Date();
const yyyy = hoy.getFullYear();
const mm = String(hoy.getMonth() + 1).padStart(2, '0');
const dd = String(hoy.getDate()).padStart(2, '0');
const today = `${yyyy}-${mm}-${dd}`;

const mesesAtras = (n: number) => {
  const d = new Date(hoy.getFullYear(), hoy.getMonth() - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const mesStr = (n: number) => {
  const d = new Date(hoy.getFullYear(), hoy.getMonth() - n, 1);
  return d.toLocaleDateString('es-GT', { month: 'short', year: '2-digit' });
};

export const DEMO_PROYECTOS: Proyecto[] = [
  {
    id: 'demo-proy-1',
    nombre: 'Residencial Altamira',
    descripcion: 'Conjunto habitacional 48 viviendas',
    tipologia: 'residencial',
    tipoObra: 'nueva',
    ubicacion: 'Zona 14, Ciudad de Guatemala',
    cliente: 'Inmobiliaria GT S.A.',
    presupuestoTotal: 4500000,
    montoContrato: 4950000,
    fechaInicio: mesesAtras(8),
    fechaFin: mesesAtras(-4),
    avanceFisico: 62,
    avanceFinanciero: 58,
    estado: 'ejecucion',
    margenUtilidadObjetivo: 10,
    moneda: 'GTQ',
    areaConstruccion: 3840,
    numPisos: 3,
    ingresoResidente: 'Carlos Méndez',
  },
  {
    id: 'demo-proy-2',
    nombre: 'Centro Comercial Plaza Norte',
    descripcion: 'Remodelación y ampliación',
    tipologia: 'comercial',
    tipoObra: 'remodelacion',
    ubicacion: 'Zona 17, Guatemala',
    cliente: 'Grupo Plaza S.A.',
    presupuestoTotal: 8200000,
    montoContrato: 9020000,
    fechaInicio: mesesAtras(12),
    fechaFin: mesesAtras(-3),
    avanceFisico: 78,
    avanceFinanciero: 82,
    estado: 'ejecucion',
    margenUtilidadObjetivo: 10,
    moneda: 'GTQ',
    areaConstruccion: 12500,
    numPisos: 4,
  },
  {
    id: 'demo-proy-3',
    nombre: 'Puente Los Cipreses',
    descripcion: 'Puente vehicular de 120m',
    tipologia: 'civil',
    tipoObra: 'nueva',
    ubicacion: 'San Lucas Sacatepéquez',
    cliente: 'Municipalidad de San Lucas',
    presupuestoTotal: 2800000,
    montoContrato: 3080000,
    fechaInicio: mesesAtras(6),
    fechaFin: mesesAtras(6),
    avanceFisico: 35,
    avanceFinanciero: 30,
    estado: 'ejecucion',
    margenUtilidadObjetivo: 10,
    moneda: 'GTQ',
  },
  {
    id: 'demo-proy-4',
    nombre: 'Planta Tratamiento Aguas',
    descripcion: 'PTAR Municipal',
    tipologia: 'industrial',
    tipoObra: 'nueva',
    ubicacion: 'Mixco, Guatemala',
    cliente: 'EMPAGUA',
    presupuestoTotal: 12000000,
    montoContrato: 13200000,
    fechaInicio: mesesAtras(3),
    fechaFin: mesesAtras(-9),
    avanceFisico: 18,
    avanceFinanciero: 20,
    estado: 'ejecucion',
    margenUtilidadObjetivo: 10,
    moneda: 'GTQ',
  },
  {
    id: 'demo-proy-5',
    nombre: 'Colonia San José Etapa III',
    descripcion: 'Vivienda de interés social',
    tipologia: 'residencial',
    cliente: 'FHAV',
    presupuestoTotal: 1800000,
    montoContrato: 1980000,
    fechaInicio: mesesAtras(1),
    fechaFin: mesesAtras(-5),
    avanceFisico: 8,
    avanceFinanciero: 5,
    estado: 'ejecucion',
    margenUtilidadObjetivo: 8,
    moneda: 'GTQ',
    ubicacion: 'Villa Nueva, Guatemala',
  },
  {
    id: 'demo-proy-6',
    nombre: 'Edificio Corporativo Torre Sur',
    descripcion: 'Oficinas corporativas 8 niveles',
    tipologia: 'comercial',
    tipoObra: 'nueva',
    ubicacion: 'Zona 10, Ciudad de Guatemala',
    cliente: 'Grupo Financiero GT',
    presupuestoTotal: 15000000,
    montoContrato: 16500000,
    fechaInicio: mesesAtras(10),
    fechaFin: mesesAtras(2),
    avanceFisico: 90,
    avanceFinanciero: 88,
    estado: 'ejecucion',
    margenUtilidadObjetivo: 10,
    moneda: 'GTQ',
    areaConstruccion: 9600,
    numPisos: 8,
  },
].map(p => ({ ...p, ubicacion: p.ubicacion || '', fechaInicio: p.fechaInicio || '', fechaFin: p.fechaFin || '' })) as Proyecto[];

const proyIds = DEMO_PROYECTOS.map(p => p.id);

const categorias = ['materiales', 'mano_obra', 'equipo', 'subcontrato', 'administracion', 'transporte', 'otros'] as const;
type Cat = typeof categorias[number];

// Movimientos de ingresos
const ingresos: Movimiento[] = proyIds.flatMap((pid, pi) => {
  const proy = DEMO_PROYECTOS[pi];
  const montoMensual = Math.round((proy.montoContrato || proy.presupuestoTotal) / 12);
  return [3,4,5,6,7,8].map((n, i) => ({
    id: uid(),
    proyectoId: pid,
    tipo: 'ingreso' as const,
    categoria: 'administracion' as Cat,
    monto: montoMensual,
    descripcion: `Estimación ${i + 1} - ${proy.nombre}`,
    fecha: mesesAtras(8 - i),
  }));
});

// Movimientos de gastos
const gastos: Movimiento[] = proyIds.flatMap((pid, pi) => {
  const proy = DEMO_PROYECTOS[pi];
  const base = Math.round((proy.presupuestoTotal) / 14);
  return [2,3,4,5,6,7,8].flatMap((n, i) => {
    const cat = categorias[i % categorias.length];
    return [
      {
        id: uid(),
        proyectoId: pid,
        tipo: 'gasto' as const,
        categoria: cat,
        monto: Math.round(base * (0.6 + Math.random() * 0.4)),
        costoTotal: Math.round(base * (0.6 + Math.random() * 0.4)),
        descripcion: `Compra ${cat} mes ${i + 1}`,
        fecha: mesesAtras(n - 1),
      },
    ];
  });
});

export const DEMO_MOVIMIENTOS: Movimiento[] = [...ingresos, ...gastos];

// Avances de obra — curva S real
export const DEMO_AVANCES: AvanceObra[] = proyIds.flatMap((pid, pi) => {
  const proy = DEMO_PROYECTOS[pi];
  const maxMeses = 8;
  const avanceTarget = proy.avanceFisico;
  return Array.from({ length: maxMeses }, (_, i) => {
    const t = (i + 1) / maxMeses;
    const sigmoide = Math.round(100 / (1 + Math.exp(-8 * (t - 0.5))));
    const avance = Math.min(sigmoide, avanceTarget + Math.round(Math.random() * 8));
    return {
      id: uid(),
      proyectoId: pid,
      presupuestoId: `demo-pres-${pi + 1}`,
      renglonId: `demo-renglon-${pi + 1}`,
      renglonCodigo: `R-${String(pi + 1).padStart(3, '0')}`,
      renglonNombre: `Avance general ${proy.nombre}`,
      fecha: mesesAtras(maxMeses - 1 - i),
      avanceFisico: Math.min(100, avance),
      cantidadEjecutada: Math.round(proy.areaConstruccion || 1000) * (avance / 100),
    };
  });
});

export const DEMO_MATERIALES: Material[] = [
  { id: uid(), nombre: 'Cemento UGC Tolteca 42.5kg', unidad: 'saco', stock: 850, stockMinimo: 200, precio: 89.50, categoria: 'materiales', proyectoIds: proyIds.slice(0, 3) },
  { id: uid(), nombre: 'Varilla corrugada #4 (3/8")', unidad: 'qq', stock: 320, stockMinimo: 100, precio: 425.00, categoria: 'materiales', proyectoIds: proyIds.slice(0, 4) },
  { id: uid(), nombre: 'Arena de río', unidad: 'm³', stock: 180, stockMinimo: 40, precio: 185.00, categoria: 'materiales', proyectoIds: proyIds.slice(0, 5) },
  { id: uid(), nombre: 'Piedrín 1/2"', unidad: 'm³', stock: 145, stockMinimo: 30, precio: 195.00, categoria: 'materiales', proyectoIds: proyIds.slice(0, 5) },
  { id: uid(), nombre: 'Block 14x19x39', unidad: 'unidad', stock: 4500, stockMinimo: 1000, precio: 6.50, categoria: 'materiales', proyectoIds: proyIds.slice(0, 3) },
  { id: uid(), nombre: 'Hierro liso 1/4"', unidad: 'qq', stock: 95, stockMinimo: 50, precio: 380.00, categoria: 'materiales', proyectoIds: proyIds.slice(0, 4) },
  { id: uid(), nombre: 'Tubería PVC 4"', unidad: 'barra', stock: 60, stockMinimo: 20, precio: 145.00, categoria: 'materiales', proyectoIds: proyIds.slice(0, 2) },
  { id: uid(), nombre: 'Clavo 2.5"', unidad: 'libra', stock: 220, stockMinimo: 50, precio: 12.50, categoria: 'materiales', proyectoIds: proyIds.slice(0, 3) },
  { id: uid(), nombre: 'Madera pino 2x4x10\'', unidad: 'unidad', stock: 380, stockMinimo: 100, precio: 45.00, categoria: 'materiales', proyectoIds: proyIds.slice(0, 4) },
  { id: uid(), nombre: 'Triplay 4x8 12mm', unidad: 'hoja', stock: 120, stockMinimo: 30, precio: 235.00, categoria: 'materiales', proyectoIds: proyIds.slice(0, 2) },
].map(m => ({ ...m, critico: m.stock <= m.stockMinimo }));

export const DEMO_EMPLEADOS: Empleado[] = [
  { id: uid(), nombre: 'Juan Pérez López', puesto: 'Albañil', salarioDiario: 150, tipo: 'planilla', activo: true, proyectoIds: proyIds.slice(0, 2) },
  { id: uid(), nombre: 'Pedro García Ruiz', puesto: 'Oficial', salarioDiario: 180, tipo: 'planilla', activo: true, proyectoIds: proyIds.slice(0, 3) },
  { id: uid(), nombre: 'María Hernández López', puesto: 'Ayudante', salarioDiario: 100, tipo: 'planilla', activo: true, proyectoIds: proyIds.slice(0, 2) },
  { id: uid(), nombre: 'Carlos Martínez Gómez', puesto: 'Maestro de obra', salarioDiario: 250, tipo: 'planilla', activo: true, proyectoIds: proyIds.slice(0, 4) },
  { id: uid(), nombre: 'Ana Santizo Morales', puesto: 'Ayudante', salarioDiario: 100, tipo: 'destajo', activo: true, proyectoIds: proyIds.slice(0, 2) },
  { id: uid(), nombre: 'José López García', puesto: 'Armador', salarioDiario: 200, tipo: 'planilla', activo: true, proyectoIds: proyIds.slice(0, 3) },
  { id: uid(), nombre: 'Luis Pérez Cruz', puesto: 'Oficial', salarioDiario: 180, tipo: 'planilla', activo: true, proyectoIds: proyIds.slice(0, 2) },
  { id: uid(), nombre: 'Rosa Méndez López', puesto: 'Ayudante', salarioDiario: 100, tipo: 'planilla', activo: true, proyectoIds: proyIds.slice(0, 2) },
  { id: uid(), nombre: 'Francisco Rivas Santos', puesto: 'Soldador', salarioDiario: 220, tipo: 'planilla', activo: true, proyectoIds: proyIds.slice(0, 3) },
  { id: uid(), nombre: 'Diego Ramírez López', puesto: 'Conductor', salarioDiario: 190, tipo: 'planilla', activo: true, proyectoIds: proyIds.slice(0, 2) },
];

export const DEMO_PROVEEDORES: Proveedor[] = [
  { id: uid(), nombre: 'Cemento Progreso S.A.', contacto: 'Carlos Soto', telefono: '2245-7890', email: 'ventas@cempro.gt', categoria: 'materiales' as Cat },
  { id: uid(), nombre: 'Ferretería Industrial GT', contacto: 'Luis Fernández', telefono: '2233-4567', email: 'lfernandez@ferrera.gt', categoria: 'materiales' as Cat },
  { id: uid(), nombre: 'Distribuidora de Hierro S.A.', contacto: 'Ana María Rivas', telefono: '2288-9012', email: 'ventas@dihierro.gt', categoria: 'materiales' as Cat },
  { id: uid(), nombre: 'Alquiler de Maquinaria Pesada', contacto: 'Pedro Solís', telefono: '2255-1234', email: 'alquiler@maqpesada.gt', categoria: 'equipo' as Cat },
  { id: uid(), nombre: 'Transportes Rápidos GT', contacto: 'Roberto Méndez', telefono: '2277-5678', email: 'logistica@transrap.gt', categoria: 'transporte' as Cat },
];

export const DEMO_ORDENES: OrdenCompra[] = [
  { id: uid(), proyectoId: 'demo-proy-1', proveedor: 'Cemento Progreso S.A.', material: 'Cemento UGC Tolteca 42.5kg', cantidad: 200, monto: 17900, fecha: mesesAtras(1), estado: 'aprobado' as const },
  { id: uid(), proyectoId: 'demo-proy-2', proveedor: 'Ferretería Industrial GT', material: 'Varilla corrugada #4', cantidad: 80, monto: 34000, fecha: mesesAtras(2), estado: 'recibida' as const },
  { id: uid(), proyectoId: 'demo-proy-1', proveedor: 'Distribuidora de Hierro S.A.', material: 'Hierro liso 1/4"', cantidad: 30, monto: 11400, fecha: mesesAtras(1), estado: 'pendiente' as const },
  { id: uid(), proyectoId: 'demo-proy-3', proveedor: 'Cemento Progreso S.A.', material: 'Cemento UGC Tolteca 42.5kg', cantidad: 150, monto: 13425, fecha: mesesAtras(3), estado: 'aprobado' as const },
  { id: uid(), proyectoId: 'demo-proy-4', proveedor: 'Alquiler de Maquinaria Pesada', material: 'Excavadora 320D', cantidad: 1, monto: 45000, fecha: mesesAtras(2), estado: 'borrador' as const },
];

export const DEMO_PRESUPUESTOS: Presupuesto[] = DEMO_PROYECTOS.map((proy, i) => ({
  id: `demo-pres-${i + 1}`,
  proyectoId: proy.id,
  tipologia: proy.tipologia,
  renglones: [],
  estado: 'aprobado' as const,
  totalCalculado: proy.presupuestoTotal,
  costoDirectoTotal: Math.round(proy.presupuestoTotal * 0.67),
  fechaCreacion: mesesAtras(9),
  fechaActualizacion: today,
  versionPresupuesto: 1,
}));

export function isDemoDataLoaded(): boolean {
  try {
    return localStorage.getItem('wm_erp_demo_loaded') === 'true';
  } catch { return false; }
}

export function markDemoLoaded(): void {
  try { localStorage.setItem('wm_erp_demo_loaded', 'true'); } catch { /* silent */ }
}

export function getDemoData() {
  return {
    proyectos: DEMO_PROYECTOS,
    movimientos: DEMO_MOVIMIENTOS,
    avances: DEMO_AVANCES,
    materiales: DEMO_MATERIALES,
    empleados: DEMO_EMPLEADOS,
    proveedores: DEMO_PROVEEDORES,
    ordenes: DEMO_ORDENES,
    presupuestos: DEMO_PRESUPUESTOS,
  };
}