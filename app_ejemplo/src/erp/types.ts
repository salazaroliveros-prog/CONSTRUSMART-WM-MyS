export type Tipologia = 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica';

export interface Insumo {
  id: string;
  nombre: string;
  tipo: 'material' | 'mano_obra' | 'equipo' | 'subcontrato';
  unidad: string;
  precio: number;
  rendimiento: number; // cantidad de insumo por unidad de obra
}

export interface RenglonBase {
  codigo: string;
  nombre: string;
  unidad: string;
  tipologia: Tipologia;
  rendimientoCuadrilla: number; // unidades/dia
  costoMateriales: number; // por unidad de obra
  costoManoObra: number; // por unidad de obra
  costoEquipo: number; // por unidad de obra
  insumos: Insumo[];
}

export interface RenglonPresupuesto extends RenglonBase {
  id: string;
  cantidad: number;
  expanded?: boolean;
}

export interface Proyecto {
  id: string;
  nombre: string;
  cliente: string;
  ubicacion: string;
  tipologia: Tipologia;
  estado: 'planeacion' | 'ejecucion' | 'finalizado';
  presupuestoTotal: number;
  montoContrato: number;
  avanceFisico: number; // %
  avanceFinanciero: number; // %
  lat: number;
  lng: number;
  fechaInicio: string;
  fechaFin: string;
}

export type Categoria =
  | 'materiales' | 'mano_obra' | 'herramienta' | 'sub_contrato'
  | 'administrativo' | 'personal' | 'transporte' | 'fijos'
  | 'hogar' | 'aporte' | 'trabajos_extra';

export interface Movimiento {
  id: string;
  tipo: 'ingreso' | 'gasto';
  proyectoId: string | null;
  descripcion: string;
  cantidad: number;
  unidad: string;
  categoria: Categoria;
  costoUnitario: number;
  costoTotal: number;
  fecha: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  puesto: string;
  proyectoId: string | null;
  salarioDiario: number;
  diasTrabajados: number;
  tipo: 'planilla' | 'destajo';
}

export interface Material {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  critico: boolean;
}

export interface OrdenCompra {
  id: string;
  proveedor: string;
  material: string;
  cantidad: number;
  monto: number;
  estado: 'borrador' | 'pendiente' | 'aprobado' | 'rechazado';
  fecha: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string;
  rubro: string;
  calificacion: number;
}

export interface EventoCalendario {
  id: string;
  fecha: string; // YYYY-MM-DD
  titulo: string;
  proyectoId: string | null;
}

export interface BitacoraEntry {
  id: string;
  proyectoId: string;
  fecha: string;
  clima: string;
  personal: number;
  maquinaria: string;
  tareas: string;
  observaciones: string;
}
