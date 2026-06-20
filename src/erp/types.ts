export type Tipologia = 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica';
export type EtapaObra = 'planificacion' | 'diseno' | 'preconstruccion' | 'construccion' | 'cierre';

export const APP_STAGES = {
  planificacion: {
    label: 'Planificación',
    icon: '📋',
    color: '#6366f1',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    texto: 'text-indigo-700',
    descripcion: 'Captación de datos del cliente y especificaciones del terreno',
    modulosPermitidos: ['proyectos', 'documentos', 'muro', 'notificaciones', 'ajustes'],
    vistasSiguiente: ['diseno'],
  },
  diseno: {
    label: 'Diseño',
    icon: '✏️',
    color: '#8b5cf6',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    texto: 'text-purple-700',
    descripcion: 'Fase de diseño para aprobación del cliente',
    modulosPermitidos: ['proyectos', 'documentos', 'muro', 'presupuestos', 'apu', 'baseprecios', 'cotizaciones', 'notificaciones', 'ajustes'],
    vistasSiguiente: ['preconstruccion'],
  },
  preconstruccion: {
    label: 'Presupuestación',
    icon: '💰',
    color: '#f59e0b',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    texto: 'text-amber-700',
    descripcion: 'Presupuestación detallada, costos totales, cronograma y materiales',
    modulosPermitidos: ['presupuestos', 'apu', 'baseprecios', 'cotizaciones', 'curvas', 'hitos', 'riesgos', 'muro', 'notificaciones', 'ajustes'],
    vistasSiguiente: ['construccion'],
  },
  construccion: {
    label: 'Construcción',
    icon: '🏗️',
    color: '#10b981',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    texto: 'text-emerald-700',
    descripcion: 'Ejecución: controles físicos, financieros y procesos constructivos',
    modulosPermitidos: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega', 'muro', 'reportes', 'avances', 'documentos', 'hitos', 'riesgos', 'cuentas-cobrar', 'cuentas-pagar', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'entradas-almacen', 'planilla-destajos', 'rendimiento-campo', 'comercial-fin', 'ajustes'],
    vistasSiguiente: ['cierre'],
  },
  cierre: {
    label: 'Cierre',
    icon: '✅',
    color: '#3b82f6',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    texto: 'text-blue-700',
    descripcion: 'Liquidación final, entrega y cierre contable',
    modulosPermitidos: ['dashboard', 'reportes', 'financiero', 'cuentas-cobrar', 'cuentas-pagar', 'documentos', 'muro', 'notificaciones', 'ajustes'],
    vistasSiguiente: [],
  },
} as const;

export type EtapaKey = keyof typeof APP_STAGES;

export interface Insumo {
  id: string;
  proyectoId: string;
  nombre: string;
  nombreMaterial?: string;
  unidad: string;
  cantidad: number;
  cantidadUnitaria?: number;
  precioUnitario: number;
  precio?: number;
  tipo: 'material' | 'mano_obra' | 'equipo' | 'subcontrato';
  rendimiento?: number;
}

export interface SubRenglon {
  id: string;
  nombreMaterial: string;
  nombre?: string;
  unidad: string;
  cantidadUnitaria: number;
  cantidad?: number;
  precioUnitario: number;
  tipo?: 'material' | 'mano_obra' | 'equipo' | 'subcontrato';
  rendimiento?: number;
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
  proyectoId: string;
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
  cuadrilla: string;
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
  proyectoId: string;
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
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  tipologia: Tipologia;
  subtipo?: string;
  tipoObra?: 'nueva' | 'remodelacion' | 'ampliacion';
  cliente?: string;
  clienteNit?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  ubicacion: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  codigoPostal?: string;
  lat?: number;
  lng?: number;
  areaConstruccion?: number;
  numPisos?: number;
  plazoSemanas?: number;
  ingenieroResidente?: string;
  supervisor?: string;
  arquitecto?: string;
  numeroExpediente?: string;
  numeroLicencia?: string;
  presupuestoTotal: number;
  montoContrato?: number;
  presupuestoActualId?: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioReal?: string;
  fechaFinEstimada?: string;
  avanceFisico: number;
  avanceFinanciero: number;
  estado: 'planeacion' | 'ejecucion' | 'pausado' | 'finalizado';
  etapa: EtapaObra;
  etapaAnterior?: EtapaObra;
  fechaCambioEtapa?: string;
  factorSobrecosto?: FactorSobrecosto;
  margenUtilidadObjetivo?: number;
  moneda?: 'GTQ' | 'USD';
  motivoPausa?: string;
  pausadoPor?: string;
  fechaPausa?: string;
  fechaReanudacionEstimada?: string;
  version?: number;
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
  proveedorNit?: string;
  factura?: string;
  formaPago?: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'otro';
  referenciaBancaria?: string;
  retencionIsr?: number;
  retencionIva?: number;
  notas?: string;
}

export interface Empleado {
  id: string;
  proyectoId: string;
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
  proyectoId: string;
  nombre: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  categoria: string;
  proyectoIds: string[];
  critico?: boolean;
  cantidadPresupuestada?: number;
  costoPresupuestado?: number;
  ultimaActualizacionPresupuesto?: string;
  version?: number;
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
  estado: 'borrador' | 'pendiente' | 'aprobado' | 'recibida' | 'rechazado' | 'cancelada';
  proveedorId?: string;
  total?: number;
  items?: { materialId: string; cantidad: number; precioUnitario: number }[];
  stockActualizado?: boolean;
  version?: number;
}

export interface Proveedor {
  id: string;
  proyectoId: string;
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
  latitud?: number;
  longitud?: number;
}

export interface Licitacion {
  id: string;
  proyectoId: string;
  nombre: string;
  cliente: string;
  monto: number;
  fechaLimite: string;
  estado: 'activa' | 'adjudicada' | 'perdida' | 'cerrada';
  probabilidad: number;
  documentos?: { nombre: string; url: string }[];
  notas?: string;
  createdAt: string;
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

export interface CentroCosto {
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
  /** Alias para compatibilidad con mapas */
  lat?: number;
  lng?: number;
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
  proyectoId: string;
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

export type CotizacionTipo = 'construccion' | 'planos_registro' | 'estudio_planificacion' | 'diseno_urbanistico' | 'anteproyecto_residencial';

export interface CotizacionCliente {
  id: string;
  proyectoId?: string;
  tipo: CotizacionTipo;
  numero: string;
  fecha: string;
  fechaVencimiento?: string;
  clienteNombre: string;
  clienteNit?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  clienteDireccion?: string;
  descripcion: string;
  alcance: string;
  renglones: RenglonPresupuesto[];
  costoDirectoTotal: number;
  precioVentaTotal: number;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida';
  notas?: string;
  createdAt: string;
  updatedAt: string;
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

export interface RecepcionAlmacen {
  id: string;
  ocId: string;
  fecha: string;
  cantidadRecibida: number;
  cantidadOC: number;
  diferencia: number;
  material: string;
  proveedor: string;
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

export interface Plano {
  id: string;
  proyectoId: string;
  nombre: string;
  disciplina: 'arquitectura' | 'estructura' | 'instalaciones' | 'electricas' | 'sanitarias' | 'mecanicas' | 'otra';
  version: string;
  fechaSubida: string;
  descripcion?: string;
  estado: 'vigente' | 'obsoleto' | 'en_revision';
  subidoPor: string;
}

export interface RFI {
  id: string;
  proyectoId: string;
  numero: string;
  titulo: string;
  descripcion: string;
  solicitante: string;
  destino: string;
  estado: 'abierto' | 'en_respuesta' | 'cerrado';
  fechaSolicitud: string;
  respuesta?: string;
  fechaRespuesta?: string;
}

export interface Submittal {
  id: string;
  proyectoId: string;
  titulo: string;
  descripcion?: string;
  categoria: 'material' | 'equipo' | 'especificacion' | 'otro';
  proveedor: string;
  fechaEnvio: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'con_comentarios';
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

// ============================================================
// MOTOR DE CÁLCULO AVANZADO - NUEVAS INTERFACES
// ============================================================

export interface DosificacionConcreto {
  resistencia: '2000psi' | '2500psi' | '3000psi' | '3500psi' | '4000psi' | '4500psi' | '5000psi';
  tipo: 'cimentacion' | 'estructura' | 'losa' | 'pavimento' | 'muro';
  tamañoAgregado: '3/4"' | '1"' | '1.5"' | '2"';
  aditivos: 'ninguno' | 'acelerador' | 'retardador' | 'plastificante' | 'impermeabilizante';
  curado: 'normal' | 'acelerado' | 'prolongado';
  cementoSacosM3: number;
  arenaM3M3: number;
  piedraM3M3: number;
  aguaLtM3: number;
}

export interface ResultadoDosificacion {
  cementoSacos: number;
  arenaM3: number;
  piedraM3: number;
  aguaLt: number;
  factorAjuste: number;
  costoTotal: number;
  desgloseCostos: {
    cemento: number;
    arena: number;
    piedra: number;
  };
}

export interface DepartamentoGT {
  codigo: string;
  nombre: string;
  capital: string;
  zonaSismica: '1' | '2' | '3' | '4';
  coeficienteSismico: number;
  cargaVivaMinimaKgM2: number;
  altitudPromedioMsnm: number;
  zonaClimatica: string;
  temperaturaPromedioC: number;
  precipitacionAnualMm: number;
  factorCostoBase: number;
}

export interface MunicipioGT {
  codigo: string;
  nombre: string;
  departamentoCodigo: string;
  altitudMsnm: number;
  distanciaCapitalKm: number;
  accesibilidad: 'excelente' | 'buena' | 'regular' | 'deficiente';
  factorCosto: number;
  factorRendimiento: number;
  normaMunicipal: string;
}

export interface ParametrosClimaticos {
  departamentoCodigo: string;
  zonaClimatica: string;
  altitudMinMsnm: number;
  altitudMaxMsnm: number;
  temperaturaMinC: number;
  temperaturaMaxC: number;
  humedadRelativaPromedioPct: number;
  precipitacionPromedioMmMes: number;
  vientoPromedioKmh: number;
  factorCuradoConcreto: number;
  factorRendimientoMO: number;
  factorProteccionEncofrados: number;
  estacionCritica: 'lluviosa' | 'seca' | 'ninguna';
  mesesCriticos: string[];
}

export interface Subtipologia {
  tipologia: 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica';
  subtipo: string;
  descripcion: string;
  factorCosto: number;
  factorRendimiento: number;
  caracteristicas: string[];
  normasEspeciales: string[];
  requisitosEspeciales: string[];
}

export interface MovimientoTierra {
  tipo: 'excavacion' | 'relleno' | 'compactacion';
  suelo: 'relleno' | 'arcilla' | 'arena' | 'roca_blanda' | 'roca_dura';
  profundidad: 'menos_1m' | '1_2m' | '2_3m' | 'mas_3m';
  acceso: 'retroexcavadora' | 'cargador' | 'manual';
  drenaje: 'seco' | 'agua' | 'lodos';
  volumen: number;
}

export interface ResultadoMovimientoTierra {
  costoUnitario: number;
  costoTotal: number;
  tiempoEstimadoDias: number;
  equipoRequerido: string[];
  factorAjusteTotal: number;
}

export interface ParametrosClimaticosExtendido {
  departamentoCodigo: string;
  zonaClimatica: string;
  altitudMinMsnm: number;
  altitudMaxMsnm: number;
  temperaturaMinC: number;
  temperaturaMaxC: number;
  humedadRelativaPromedioPct: number;
  precipitacionPromedioMmMes: number;
  vientoPromedioKmh: number;
  factorCuradoConcreto: number;
  factorRendimientoMO: number;
  factorProteccionEncofrados: number;
  estacionCritica: 'lluviosa' | 'seca' | 'ninguna';
  mesesCriticos: string[];
}

export interface FactorClimatico {
  factorCurado: number;
  factorRendimiento: number;
  factorProteccion: number;
  factorAjusteEstacional: number;
  observaciones: string;
}

export interface Pavimento {
  uso: 'peatonal' | 'vehicular_liviano' | 'vehicular_medio' | 'vehicular_pesado';
  tipo: 'adoquinado' | 'concreto' | 'asfaltico' | 'interlock' | 'ceramico';
  tipoBase: 'c4' | 'piedra_picada' | 'grava' | 'arena';
  tipoSello: 'arena' | 'cemento' | 'ninguno' | 'asfalto';
  areaM2: number;
}

export interface ResultadoPavimento {
  espesorCm: number;
  costoSuperficieM2: number;
  costoBaseM3: number;
  costoSelloM2: number;
  costoTotalM2: number;
  costoTotal: number;
  volumenBaseM3: number;
  referenciaNorma: string;
}

export interface RedInfraestructura {
  tipo: 'agua_potable' | 'alcantarillado_sanitario' | 'alcantarillado_pluvial';
  diametroPulgadas: number;
  material: 'pvc' | 'cpvc' | 'cobre' | 'hdpe' | 'concreto' | 'fierro_fundido';
  presion: 'baja' | 'media' | 'alta';
  longitudMl: number;
}

export interface ResultadoRedInfraestructura {
  costoUnitarioMl: number;
  costoTotal: number;
  factorAjusteMaterial: number;
  referenciaNorma: string;
}

export interface MuroContencion {
  alturaM: number;
  tipo: 'gravedad' | 'cantiliver' | 'atirantado' | 'tipo celular' | 'pantalla';
  tipoCimentacion: 'zapata_corrida' | 'pilotes' | 'losa';
  tipoSuelo: 'arcilla' | 'arena' | 'roca' | 'relleno_compactado' | 'granular';
  tipoDrenaje: 'sin_drenaje' | 'drenaje_superficial' | 'drenaje_interno' | 'drenaje_completo';
  longitudM: number;
}

export interface ResultadoMuroContencion {
  costoUnitarioM2: number;
  costoTotal: number;
  factorAjusteTotal: number;
  volumenConcretoM3: number;
  referenciaNorma: string;
}

export interface CalculoProyecto {
  id?: string;
  proyectoId: string;
  tipoCalcululo: 'apu' | 'dosificacion' | 'acero' | 'movimiento_tierra' | 'pavimento' | 'red_infraestructura' | 'muro_contencion' | 'climaticos';
  fechaCalcululo?: Date;
  usuarioId?: string;
  parametros: Record<string, any>;
  resultados: Record<string, any>;
  versionCalculculo?: number;
  origenCalcululo?: 'manual' | 'automatico' | 'importado';
  observaciones?: string;
  validado?: boolean;
  validadoPor?: string;
  fechaValidacion?: Date;
  notasValidacion?: string;
}

export interface ComparacionCalculos {
  id?: string;
  calculoBaseId: string;
  calculoComparadoId: string;
  fechaComparacion?: Date;
  diferencias: Record<string, any>;
  tipoCambio?: string;
  magnitudCambio?: number;
  porcentajeCambio?: number;
  aceptado?: boolean;
  motivoRechazo?: string;
}

export interface NormativaDepartamental {
  id?: string;
  departamentoCodigo: 'GT-01' | 'GT-02' | 'GT-03' | 'GT-04' | 'GT-05' | 'GT-06' | 'GT-07' | 'GT-08' | 'GT-09' | 'GT-10' | 'GT-11' | 'GT-12' | 'GT-13' | 'GT-14' | 'GT-15' | 'GT-16' | 'GT-17' | 'GT-18' | 'GT-19' | 'GT-20' | 'GT-21' | 'GT-22';
  tipoNorma: 'estructural' | 'urbanistica' | 'ambiental' | 'sismica' | 'electrica' | 'sanitaria';
  codigoNorma: string;
  nombreNorma: string;
  descripcion?: string;
  anoUltimaRevision?: number;
  organismoEmisor?: string;
  requisitosEspecificos: Record<string, any>;
  aplicacion?: string;
  activo?: boolean;
}

export interface EscalaProduccion {
  id?: string;
  tipoProyecto: string;
  rangoTamano: string;
  tamanoMinimo?: number;
  tamanoMaximo?: number;
  factorEconomia: number;
  factorAdministracion: number;
  factorImprevistos: number;
  descripcion?: string;
  activo?: boolean;
}

export interface Estacionalidad {
  id?: string;
  departamentoCodigo: string;
  mes: number;
  factorDisponibilidad: number;
  factorCosto: number;
  factorProductividad: number;
  condicionesEspeciales?: string;
  activo?: boolean;
}

export interface ReglaFactor {
  id?: string;
  nombre: string;
  descripcion?: string;
  tipo_factor: 'zona' | 'tipologia' | 'escalas' | 'estacional' | 'climatico' | 'normativa' | 'sobrecosto';
  prioridad: number;
  condicion: Record<string, any>;
  factor_aplicacion: number;
  operador: 'multiplicar' | 'sumar' | 'restar' | 'porcentaje';
  ambito: 'global' | 'departamento' | 'municipio' | 'proyecto' | 'renglon';
  departamento_id?: string;
  municipio_id?: string;
  tipologia?: string;
  activo?: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HistorialAplicacionRegla {
  id?: string;
  proyecto_id?: string;
  renglon_id?: string;
  regla_id: string;
  valor_original: number;
  valor_aplicado: number;
  factor_aplicado: number;
  contexto_aplicacion: Record<string, any>;
  usuario_id?: string;
  fecha_aplicacion?: string;
  created_at?: string;
}

export interface ResultadoAplicacionReglas {
  valor_final: number;
  reglas_aplicadas: Array<{
    regla_id: string;
    nombre: string;
    factor: number;
    operador: string;
    prioridad: number;
  }>;
  factor_total: number;
}
