export type Tipologia = 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica';

export interface Insumo {
  id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  tipo: 'material' | 'mano_obra' | 'equipo' | 'subcontrato';
  rendimiento?: number;
}

export interface SubRenglon {
  id: string;
  nombreMaterial: string;
  unidad: string;
  cantidadUnitaria: number;
  precioUnitario: number;
}

export interface SeguimientoEVM {
  id: string;
  proyectoId: string;
  fecha: string;
  avanceFisico: number;
  avanceFinanciero: number;
  costoPlaneado: number;
  costoReal: number;
  valorPlaneado: number;
  valorGanado: number;
  cv?: number | null;
  sv?: number | null;
  createdAt?: string;
}

export interface InsumoBase {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  unidad: string;
  precioReferencia: number;
  rubro: string;
  activo: boolean;
  fechaActualizacion?: string;
}

export interface HistorialPrecio {
  id: string;
  insumoBaseId: string;
  trimestre: string;
  precio: number;
  fecha: string;
}

export interface RendimientoCuadrilla {
  id: string;
  actividad: string;
  unidad: string;
  cuadrillaTipo: string;
  rendimientoDiario: number;
}

export interface FactorSobrecosto {
  indirectos: number;
  administracion: number;
  imprevistos: number;
  utilidad: number;
}

export interface RenglonBase {
  codigo: string;
  nombre: string;
  unidad: string;
  tipologia: Tipologia;
  rendimientoCuadrilla: number;
  costoMateriales: number;
  costoManoObra: number;
  costoEquipo: number;
  insumos: Insumo[];
  subRenglones?: SubRenglon[];
  factorSobrecosto?: FactorSobrecosto;
  totalCD?: number;
  totalPV?: number;
}

export interface RenglonPresupuesto extends RenglonBase {
  id: string;
  cantidad: number;
  avanceFisico?: number;
  avanceFinanciero?: number;
  /** IDs de renglones predecesores para dependencias en Gantt (M-03) */
  predecesores?: string[];
}

export interface Presupuesto {
  id: string;
  proyectoId: string;
  tipologia: Tipologia;
  renglones: RenglonPresupuesto[];
  estado: 'borrador' | 'aprobado' | 'revisado' | 'rechazado';
  totalCalculado: number;
  costoDirectoTotal: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  versionPresupuesto?: number;
  notas?: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  ubicacion: string;
  tipologia: Tipologia;
  presupuestoTotal: number;
  montoContrato?: number;
  cliente?: string;
  presupuestoActualId?: string;
  fechaInicio: string;
  fechaFin: string;
  avanceFisico: number;
  avanceFinanciero: number;
  estado: 'planeacion' | 'ejecucion' | 'pausado' | 'finalizado';
  factorSobrecosto?: FactorSobrecosto;
  lat?: number;
  lng?: number;
}

export type Categoria = 'materiales' | 'mano_obra' | 'equipo' | 'subcontrato' | 'administracion' | 'transporte' | 'imprevistos' | 'marketing' | 'licencias' | 'seguros' | 'otros';

export interface Movimiento {
  id: string;
  proyectoId: string;
  tipo: 'ingreso' | 'gasto' | 'egreso';
  categoria: Categoria;
  monto: number;
  costoTotal?: number;
  costoUnitario?: number;
  cantidad?: number;
  unidad?: string;
  descripcion: string;
  fecha: string;
  proveedor?: string;
  factura?: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  puesto: string;
  salarioDiario: number;
  tipo: 'planilla' | 'destajo';
  activo: boolean;
  proyectoIds: string[];
  telefono?: string;
  diasTrabajados?: number;
  fechaAsignacion?: string; // F-03: Fecha de asignación al proyecto
}

export interface Material {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  categoria: string;
  proyectoIds: string[];
  critico?: boolean;
}

export interface ValeSalida {
  id: string;
  proyectoId: string;
  renglonId?: string;
  fecha: string;
  items: ValeSalidaItem[];
  observaciones?: string;
  solicitante: string;
}

export interface ValeSalidaItem {
  materialId: string;
  cantidad: number;
}

export interface OrdenCompra {
  id: string;
  proyectoId?: string;
  proveedor: string;
  material: string;
  cantidad: number;
  monto: number;
  fecha: string;
  estado: 'pendiente' | 'aprobado' | 'recibida' | 'rechazado' | 'cancelada';
  proveedorId?: string;
  total?: number;
  items?: { materialId: string; cantidad: number; precioUnitario: number }[];
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  categoria: Categoria;
  rubro?: string;
  calificacion?: number;
}

export interface EventoCalendario {
  id: string;
  proyectoId: string;
  titulo: string;
  fecha: string;
  hora: string;
  tipo: 'reunion' | 'inspeccion' | 'entrega' | 'pago' | 'otros';
  descripcion?: string;
  participantes: string[];
  completado?: boolean;
}

export interface BitacoraEntry {
  id: string;
  proyectoId: string;
  fecha: string;
  clima: 'soleado' | 'nublado' | 'lluvia';
  personalPresente: number;
  maquinaria: string;
  tareasRealizadas: string;
  observaciones: string;
  fotos: string[];
  firma?: string;
  latitud?: number;
  longitud?: number;
}

export interface AvanceObra {
  id: string;
  proyectoId: string;
  presupuestoId: string;
  renglonId: string;
  renglonCodigo?: string;
  renglonNombre?: string;
  fecha: string;
  avanceFisico: number;
  cantidadEjecutada: number;
  foto?: string;
  notas?: string;
  lat?: number;
  lng?: number;
}

export interface Licitacion {
  id: string;
  nombre: string;
  cliente: string;
  monto: number;
  fechaLimite: string;
  estado: 'activa' | 'ganada' | 'perdida' | 'cancelada';
  documentos: { nombre: string; url: string }[];
  notas?: string;
}

export interface PublicacionMuro {
  id: string;
  proyectoId: string;
  autor: string;
  autorAvatar?: string;
  contenido: string;
  tipo: 'avance' | 'calidad' | 'seguridad' | 'general';
  fotos: string[];
  documento?: { nombre: string; url: string };
  createdAt: string;
  likes: number;
  comentarios: ComentarioMuro[];
}

export interface ComentarioMuro {
  id: string;
  autor: string;
  autorAvatar?: string;
  contenido: string;
  createdAt: string;
}

export interface OrdenCambio {
  id: string;
  proyectoId: string;
  titulo: string;
  descripcion: string;
  impactoCosto: number;
  impactoPlazo: number;
  estado: 'solicitud' | 'revision' | 'aprobado' | 'rechazado';
  solicitante: string;
  solicitanteRol: string;
  aprobador?: string;
  fechaAprobacion?: string;
  createdAt: string;
}

export interface Notificacion {
  id: string;
  tipo: 'checklist_rechazado' | 'orden_cambio_pendiente' | 'stock_critico' | 'desviacion_rendimiento' | 'avance_registrado' | 'general';
  titulo: string;
  mensaje: string;
  proyectoId?: string;
  referenciaId?: string;
  leido: boolean;
  createdAt: string;
}

export interface Hito {
  id: string;
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  fecha: string;
  tipo: 'inicio' | 'hito' | 'entrega' | 'cierre';
  estado: 'pendiente' | 'completado' | 'retrasado';
  responsable?: string;
  dependeDe?: string[]; // IDs de hitos predecesores
  completadoEn?: string;
  createdAt: string;
}

export type Rol = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

export interface Incidente {
  id: string;
  proyectoId: string;
  tipo: 'accidente' | 'cuasi-accidente' | 'condicion_insegura' | 'acto_inseguro';
  fecha: string;
  hora: string;
  descripcion: string;
  afectados: string;
  testigos?: string;
  accionesInmediatas?: string;
  reportadoPor: string;
  latitud?: number;
  longitud?: number;
  fotos: string[];
  estado: 'abierto' | 'investigacion' | 'cerrado';
}

export interface PruebaLaboratorio {
  id: string;
  proyectoId: string;
  tipo: 'concreto' | 'suelos' | 'acero' | 'asfalto' | 'otro';
  descripcion: string;
  fechaMuestra: string;
  fechaResultado?: string;
  resultado: 'pendiente' | 'pasa' | 'no_pasa';
  responsable: string;
  observaciones?: string;
}

export interface NoConformidad {
  id: string;
  proyectoId: string;
  codigo: string;
  descripcion: string;
  categoria: 'material' | 'proceso' | 'documentacion' | 'seguridad' | 'otro';
  fechaDeteccion: string;
  detectadoPor: string;
  planAccion?: string;
  responsableCierre?: string;
  fechaCierre?: string;
  estado: 'detectado' | 'plan_accion' | 'cerrado';
}

export interface LiberacionPartida {
  id: string;
  proyectoId: string;
  renglonId: string;
  renglonNombre: string;
  fechaSolicitud: string;
  fechaLiberacion?: string;
  solicitante: string;
  supervisor: string;
  checklistAprobado: boolean;
  observaciones?: string;
  estado: 'pendiente' | 'liberado' | 'rechazado';
}

// ============================================================
// NUEVAS INTERFACES FASE 2 - Cadena de Suministro
// ============================================================

export interface ActivoHerramienta {
  id: string;
  nombre: string;
  codigoInventario: string;
  tipo: 'herramienta' | 'equipo' | 'vehiculo' | 'accesorio';
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  valorAdquisicion: number;
  estado: 'disponible' | 'asignado' | 'mantenimiento' | 'baja';
  ubicacion?: string;
  asignadoA?: string;
  proyectoId?: string;
  fechaAsignacion?: string;
  fechaAdquisicion: string;
}

export interface CuadroComparativo {
  id: string;
  proyectoId?: string;
  solicitud: string;
  fechaSolicitud: string;
  fechaCierre?: string;
  estado: 'abierto' | 'cerrado' | 'adjudicado';
  adjudicadoA?: string;
  observaciones?: string;
  cotizaciones: CotizacionItem[];
}

export interface CotizacionItem {
  id: string;
  cuadroId: string;
  proveedorId: string;
  proveedorNombre: string;
  montoTotal: number;
  plazoEntrega?: number;
  condicionesPago?: string;
  validezOferta?: string;
  seleccionada: boolean;
}

export interface VinculacionOCExplosion {
  renglonCodigo: string;
  materialId: string;
  cantidadRequerida: number;
  cantidadOC: number;
  excedente: number;
  alerta: boolean;
}

export interface ValeSalidaRenglon {
  id: string;
  valeSalidaId: string;
  renglonId: string;
  renglonCodigo: string;
  materialId: string;
  materialNombre: string;
  cantidad: number;
  unidad: string;
}

// ============================================================
// NUEVAS INTERFACES FASE 2 - Campo y Evidencia
// ============================================================

export interface Destajo {
  id: string;
  proyectoId: string;
  renglonCodigo: string;
  cuadrilla: string;
  fecha: string;
  cantidadEjecutada: number;
  unidad: string;
  horasTrabajadas: number;
  rendimientoReal: number;
  rendimientoTeorico: number;
  observaciones?: string;
}

export interface PlantillaSubrenglon {
  id: string;
  renglonCodigo: string;
  renglonNombre: string;
  nombreMaterial: string;
  unidad: string;
  cantidadUnitaria: number;
  precioReferencia: number;
}

// ============================================================
// NUEVAS INTERFACES FASE 3 - Admin/Finanzas/Comercial
// ============================================================

export interface VentaPaquete {
  id: string;
  proyectoId: string;
  tipo: 'unidad' | 'lote' | 'paquete';
  identificador: string;
  precioVenta: number;
  precioContrato: number;
  estado: 'disponible' | 'reservado' | 'vendido' | 'entregado';
  cliente?: string;
  fechaReserva?: string;
  fechaVenta?: string;
  planPago?: string;
  notas?: string;
}

export interface Anticipo {
  id: string;
  proyectoId: string;
  montoTotal: number;
  saldoPendiente: number;
  tipo: 'cliente' | 'proveedor' | 'empleado';
  beneficiario: string;
  concepto: string;
  fechaEntrega: string;
  fechaUltimaAmortizacion?: string;
  estado: 'activo' | 'amortizado' | 'cancelado';
  amortizaciones: AmortizacionItem[];
}

export interface AmortizacionItem {
  id: string;
  anticipoId: string;
  monto: number;
  fecha: string;
  referencia?: string;
}

export interface CajaChica {
  id: string;
  proyectoId: string;
  monto: number;
  descripcion: string;
  categoria: 'materiales' | 'herramientas' | 'transporte' | 'comidas' | 'otros';
  fechaGasto: string;
  facturaUrl?: string;
  fotoUrl?: string;
  solicitante: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  aprobadoPor?: string;
  fechaAprobacion?: string;
  latitud?: number;
  longitud?: number;
}

export interface PagoProveedor {
  id: string;
  proyectoId?: string;
  proveedorId: string;
  proveedorNombre: string;
  monto: number;
  concepto: string;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaPago?: string;
  estado: 'pendiente' | 'pagado' | 'vencido' | 'cancelado';
  facturaUrl?: string;
}

export interface CentroCosto {
  id: string;
  proyectoId: string;
  codigo: string;
  nombre: string;
  presupuestoAsignado: number;
  gastoActual: number;
  tipo: 'directo' | 'indirecto' | 'administrativo';
}

// ============================================================
// NUEVAS INTERFACES FASE 4 - Seguridad
// ============================================================

export interface LogAuditoria {
  id: string;
  usuarioId?: string;
  usuarioNombre: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  valoresAnteriores?: Record<string, unknown>;
  valoresNuevos?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================
// INTERFACES PARA RENDIMIENTO Y DESTAJOS
// ============================================================

export interface Riesgo {
  id: string;
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  tipo: 'tecnico' | 'financiero' | 'cronograma' | 'legal' | 'ambiental' | 'seguridad' | 'otro';
  probabilidad: 1 | 2 | 3 | 4 | 5;
  impacto: 1 | 2 | 3 | 4 | 5;
  nivel: 'bajo' | 'medio' | 'alto' | 'critico';
  planMitigacion?: string;
  planContingencia?: string;
  responsable?: string;
  fechaIdentificacion: string;
  estado: 'identificado' | 'en_mitigacion' | 'mitigado' | 'materializado';
  costoSoporte?: number;
  createdAt: string;
}

export interface CuentaCobrar {
  id: string;
  proyectoId: string;
  cliente: string;
  concepto: string;
  monto: number;
  saldoPendiente: number;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaCobro?: string;
  estado: 'pendiente' | 'parcial' | 'cobrado' | 'vencido' | 'incobrable';
  notas?: string;
}

export interface CuentaPagar {
  id: string;
  proyectoId: string;
  proveedor: string;
  concepto: string;
  monto: number;
  saldoPendiente: number;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaPago?: string;
  estado: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
  facturaUrl?: string;
}

export interface CapturaRendimiento {
  id: string;
  proyectoId: string;
  renglonCodigo: string;
  actividad: string;
  cuadrilla: string;
  fecha: string;
  cantidad: number;
  unidad: string;
  horas: number;
  rendimientoTeorico: number;
  rendimientoReal: number;
  eficiencia: number;
  observaciones?: string;
}
