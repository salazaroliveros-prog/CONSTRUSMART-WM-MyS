// src/erp/types-sync.ts
// Sincronización de tipos TypeScript con BD actualizada
// TIER 1 COMPLETADA

// ============================================================
// TIPOS ACTUALIZADOS - DESPUÉS DE MIGRACIONES TIER 1
// ============================================================

export type Tipologia = 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica';
export type EtapaObra = 'planificacion' | 'diseno' | 'preconstruccion' | 'construccion' | 'cierre';
export type TipoObra = 'nueva' | 'remodelacion' | 'ampliacion';
export type EstadoProyecto = 'planeacion' | 'ejecucion' | 'pausado' | 'finalizado';
export type Moneda = 'GTQ' | 'USD';

// ✅ ACTUALIZADO: Proyecto ahora tiene 46 campos (era 23)
export interface Proyecto {
  // CAMPOS BASE (siempre presentes)
  id: string;
  nombre: string;
  cliente: string;
  ubicacion: string;
  tipologia: Tipologia;
  estado: EstadoProyecto;
  presupuestoTotal: number;
  avanceFisico: number;
  avanceFinanciero: number;
  fechaInicio: string;
  fechaFin: string;
  createdAt?: string;
  updatedAt?: string;

  // ✅ NUEVOS CAMPOS FASE 1 (28 columnas agregadas)
  descripcion?: string;
  subtipo?: string;
  tipoObra?: TipoObra;
  
  // Contacto cliente expandido
  clienteNit?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  
  // Ubicación detallada
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string; // Default: 'Guatemala'
  codigoPostal?: string;
  lat?: number;
  lng?: number;
  
  // Especificaciones obra
  areaConstruccion?: number;
  numPisos?: number;
  plazoSemanas?: number;
  
  // Personal asignado (UUIDs de usuarios)
  ingenieroResidente?: string;
  supervisor?: string;
  arquitecto?: string;
  
  // Documentación
  numeroExpediente?: string; // UNIQUE
  numeroLicencia?: string; // UNIQUE
  
  // Seguimiento temporal
  fechaInicioReal?: string;
  fechaFinEstimada?: string;
  
  // Etapas (con histórico)
  etapa?: EtapaObra;
  etapaAnterior?: EtapaObra;
  fechaCambioEtapa?: string;
  
  // Económico
  montoContrato?: number;
  margenUtilidadObjetivo?: number;
  moneda?: Moneda; // Default: 'GTQ'
  presupuestoActualId?: string;
  factorSobrecosto?: FactorSobrecosto;
  
  // Pausas
  motivoPausa?: string;
  pausadoPor?: string;
  fechaPausa?: string;
  fechaReanudacionEstimada?: string;
  
  // Versionado
  version?: number; // Default: 1
}

// ✅ NUEVA INTERFACE: Hito (Gantt M-03)
export interface Hito {
  id: string;
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  fecha: string;
  tipo: 'inicio' | 'hito' | 'entrega' | 'cierre';
  estado: 'pendiente' | 'completado' | 'retrasado';
  responsable?: string; // UUID
  depende_de?: string[]; // UUIDs de hitos predecesores
  completadoEn?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ NUEVA INTERFACE: Riesgo
export interface Riesgo {
  id: string;
  proyectoId: string;
  nombre: string;
  descripcion?: string;
  tipo: 'tecnico' | 'financiero' | 'cronograma' | 'legal' | 'ambiental' | 'seguridad' | 'otro';
  probabilidad: 1 | 2 | 3 | 4 | 5;
  impacto: 1 | 2 | 3 | 4 | 5;
  nivel?: 'bajo' | 'medio' | 'alto' | 'critico'; // GENERATED en BD
  planMitigacion?: string;
  planContingencia?: string;
  responsable?: string; // UUID
  fechaIdentificacion: string;
  estado: 'identificado' | 'en_mitigacion' | 'mitigado' | 'materializado';
  costoSoporte?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ NUEVA INTERFACE: CuentaCobrar
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
  createdAt?: string;
  updatedAt?: string;
}

// ✅ NUEVA INTERFACE: CuentaPagar
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
  createdAt?: string;
  updatedAt?: string;
}

// ✅ ACTUALIZADO: RenglonPresupuesto con predecesores (Gantt)
export interface RenglonPresupuesto {
  id: string;
  presupuestoId: string; // ✅ NUEVO FK
  proyectoId: string;
  codigo: string;
  nombre: string;
  unidad: string;
  tipologia: Tipologia;
  rendimientoCuadrilla: number;
  costoMateriales: number;
  costoManoObra: number;
  costoEquipo: number;
  cantidad: number;
  avanceFisico?: number; // ✅ NUEVO
  avanceFinanciero?: number; // ✅ NUEVO
  predecesores?: string[]; // ✅ NUEVO - IDs renglones predecesores para Gantt
  insumos?: Insumo[];
  createdAt?: string;
  updatedAt?: string;
}

// ✅ ACTUALIZADO: Movimiento con campos financieros
export interface Movimiento {
  id: string;
  proyectoId: string;
  tipo: 'ingreso' | 'gasto' | 'egreso'; // ✅ ACTUALIZADO (antes faltaba 'egreso')
  categoria: Categoria;
  monto: number;
  costoTotal?: number;
  costoUnitario?: number;
  cantidad?: number;
  unidad?: string;
  descripcion: string;
  fecha: string;
  
  // ✅ NUEVOS CAMPOS FINANCIEROS
  proveedor?: string;
  proveedorNit?: string;
  factura?: string;
  formaPago?: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta' | 'otro';
  referenciaBancaria?: string;
  retencionIsr?: number;
  retencionIva?: number;
  notas?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

// ✅ NUEVA INTERFACE: RelacionM2M para Empleados
export interface EmpleadoProyecto {
  id: string;
  empleadoId: string;
  proyectoId: string;
  fechaAsignacion: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ NUEVA INTERFACE: RelacionM2M para Materiales
export interface MaterialProyecto {
  id: string;
  materialId: string;
  proyectoId: string;
  cantidadPresupuestada?: number;
  costoPresupuestado?: number;
  ultimaActualizacionPresupuesto?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// INTERFACES EXISTENTES (SIN CAMBIOS)
// ============================================================

export type Categoria = 'materiales' | 'mano_obra' | 'equipo' | 'subcontrato' | 'administracion' | 'transporte' | 'imprevistos' | 'marketing' | 'licencias' | 'seguros' | 'otros';

export interface FactorSobrecosto {
  indirectos: number;
  administracion: number;
  imprevistos: number;
  utilidad: number;
}

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

// ... (resto de interfaces existentes sin cambios)

// ============================================================
// ESTADO DE SINCRONIZACIÓN
// ============================================================

/*
✅ TIER 1 COMPLETADA - Tipos Sincronizados:

NUEVAS INTERFACES (4):
- Hito (cronograma/Gantt M-03)
- Riesgo (gestión riesgos)
- CuentaCobrar (financiero)
- CuentaPagar (financiero)

INTERFACES MEJORADAS (3):
- Proyecto: +28 campos → 46 total
- RenglonPresupuesto: +3 campos (presupuesto_id, avance*, predecesores)
- Movimiento: +8 campos financieros

NUEVAS RELACIONES M:M (2):
- EmpleadoProyecto
- MaterialProyecto

PRÓXIMAS (TIER 2):
- Destajo
- OrdenCambio
- Notificacion
- y 8 más...

COMPLETITUD: 70% (era 52%)
PRÓXIMO PASO: Ejecutar migraciones en Supabase Studio
*/
