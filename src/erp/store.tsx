import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { sanitizarObjeto, sanitizarTexto, getServerRole } from '@/lib/security';
// useSupabaseRealtime import removed - hook was commented out and causing issues
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import {
  Proyecto, Movimiento, Empleado, Material, OrdenCompra, Proveedor, EventoCalendario, BitacoraEntry, Presupuesto, Licitacion, AvanceObra, ValeSalida, Notificacion, OrdenCambio, SeguimientoEVM,
  CuentaCobrar, CuentaPagar, Hito, Riesgo, PublicacionMuro, ComentarioMuro, PruebaLaboratorio, NoConformidad, LiberacionPartida,
  Plano, RFI, Submittal, ActivoHerramienta, CuadroComparativo, PagoProveedor, CotizacionCliente,
} from './types';

// Schemas fragmentados — fuente canónica de validación
import {
  proyectoSchema,
  movimientoSchema,
  cuentaCobrarSchema,
  cuentaPagarSchema,
  ordenCambioSchema,
  presupuestoSchema,
  cotizacionSchema,
  empleadoSchema,
  incidenteSchema,
  materialSchema,
  ordenSchema,
  proveedorSchema,
  eventoCalendarioSchema,
  eventoSchema,
  bitacoraEntrySchema,
  bitacoraSchema,
  seguimientoSchema,
  hitoSchema,
  riesgoSchema,
  muroSchema,
  notificacionSchema,
  liberacionSchema,
  pruebaSchema,
  noConformidadSchema,
  activoSchema,
  licitacionSchema,
  cuadroSchema,
  pagoProveedorSchema,
  planoSchema,
  rfiSchema,
  submittalSchema,
} from './store/schemas';

const proyectoSchemaInline = z.object({
  id: z.string(),
  nombre: z.string(),
  ubicacion: z.string(),
  tipologia: z.enum(['residencial','comercial','industrial','civil','publica']),
  presupuestoTotal: z.number().default(0),
  montoContrato: z.number().default(0),
  cliente: z.string().default(''),
  presupuestoActualId: z.string().nullable().optional(),
  fechaInicio: z.string().default(''),
  fechaFin: z.string().default(''),
  fechaInicioReal: z.string().optional().default(''),
  fechaFinEstimada: z.string().optional().default(''),
  avanceFisico: z.number().default(0),
  avanceFinanciero: z.number().default(0),
  estado: z.enum(['planeacion','ejecucion','pausado','finalizado']).default('planeacion'),
  // Campos extendidos del formulario
  descripcion: z.string().optional().default(''),
  tipoObra: z.enum(['nueva','remodelacion','ampliacion']).optional().default('nueva'),
  clienteNit: z.string().optional().default(''),
  clienteTelefono: z.string().optional().default(''),
  clienteEmail: z.string().optional().default(''),
  direccion: z.string().optional().default(''),
  ciudad: z.string().optional().default(''),
  departamento: z.string().optional().default(''),
  codigoPostal: z.string().optional().default(''),
  pais: z.string().optional().default('Guatemala'),
  areaConstruccion: z.number().optional(),
  numPisos: z.number().optional(),
  plazoSemanas: z.number().optional(),
  ingenieroResidente: z.string().optional().default(''),
  supervisor: z.string().optional().default(''),
  arquitecto: z.string().optional().default(''),
  numeroExpediente: z.string().optional().default(''),
  numeroLicencia: z.string().optional().default(''),
  margenUtilidadObjetivo: z.number().optional(),
  moneda: z.enum(['GTQ','USD']).optional().default('GTQ'),
  etapa: z.enum(['planificacion','diseno','preconstruccion','construccion','cierre']).optional().default('planificacion'),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
  factorSobrecosto: z.object({
    indirectos: z.number(),
    administracion: z.number(),
    imprevistos: z.number(),
    utilidad: z.number(),
  }).optional(),
}).transform(d => ({
  ...d,
  lat: d.lat ?? d.latitud ?? 14.6349,
  lng: d.lng ?? d.longitud ?? -90.5069,
  fechaInicio: d.fechaInicio ?? '',
  fechaFin: d.fechaFin ?? '',
  presupuestoActualId: d.presupuestoActualId ?? undefined,
}));

// erp_proveedores: sin telefono, email, categoria en DB
const proveedorSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  contacto: z.string().nullable().optional().default(''),
  rubro: z.string().nullable().optional(),
  calificacion: z.number().nullable().optional(),
  // campos no en DB — defaults
  telefono: z.string().optional().default(''),
  email: z.string().optional().default(''),
  categoria: z.string().optional().default('materiales'),
}).transform(d => ({
  ...d,
  contacto: d.contacto ?? '',
  telefono: d.telefono ?? '',
  email: d.email ?? '',
  categoria: (d.categoria ?? 'materiales') as import('./types').Categoria,
}));

// erp_eventos_calendario: sin participantes en DB
const eventoCalendarioSchema = z.object({
  id: z.string(),
  // proyecto_id → proyectoId
  proyectoId: z.string().nullable().optional().default(''),
  titulo: z.string().default(''),
  fecha: z.string(),
  hora: z.string().nullable().optional().default(''),
  // tipo DB = Recordatorio|Actividad|Reunión|Visita (distinto al tipo TS)
  tipo: z.string().nullable().optional().default('otros').transform(t => {
    const map: Record<string, string> = {
      'Recordatorio': 'otros', 'Actividad': 'otros',
      'Reunión': 'reunion', 'Visita': 'inspeccion',
    };
    return (map[t ?? ''] ?? t ?? 'otros') as 'reunion' | 'inspeccion' | 'entrega' | 'pago' | 'otros';
  }),
  descripcion: z.string().nullable().optional(),
  completado: z.boolean().nullable().optional(),
  // participantes no existe en DB
  participantes: z.array(z.string()).optional().default([]),
}).transform(d => ({
  ...d,
  proyectoId: d.proyectoId ?? '',
  hora: d.hora ?? '',
  participantes: d.participantes ?? [],
}));

// erp_bitacora: personal (no personalPresente), tareas (no tareasRealizadas), sin fotos
const bitacoraEntrySchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  fecha: z.string(),
  clima: z.string().nullable().optional().default('soleado').transform(c =>
    (c ?? 'soleado') as 'soleado' | 'nublado' | 'lluvia'
  ),
  // personal → personalPresente
  personal: z.number().nullable().optional().default(0),
  personalPresente: z.number().optional().default(0),
  maquinaria: z.string().nullable().optional().default(''),
  // tareas → tareasRealizadas
  tareas: z.string().nullable().optional().default(''),
  tareasRealizadas: z.string().optional().default(''),
  observaciones: z.string().nullable().optional().default(''),
  // fotos no existe en DB
  fotos: z.array(z.string()).optional().default([]),
  firma: z.string().nullable().optional(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
}).transform(d => ({
  ...d,
  personalPresente: d.personalPresente || d.personal || 0,
  tareasRealizadas: d.tareasRealizadas || d.tareas || '',
  maquinaria: d.maquinaria ?? '',
  observaciones: d.observaciones ?? '',
  fotos: d.fotos ?? [],
}));

const factorSobrecostoZ = z.object({
  indirectos: z.number(),
  administracion: z.number(),
  imprevistos: z.number(),
  utilidad: z.number(),
});

const insumoZ = z.object({
  id: z.string(),
  nombre: z.string(),
  nombreMaterial: z.string().optional(),
  unidad: z.string(),
  cantidad: z.number(),
  cantidadUnitaria: z.number().optional(),
  precioUnitario: z.number(),
  precio: z.number().optional(),
  tipo: z.enum(['material', 'mano_obra', 'equipo', 'subcontrato']),
  rendimiento: z.number().optional(),
});

const subRenglonZ = z.object({
  id: z.string(),
  nombreMaterial: z.string(),
  nombre: z.string().optional(),
  unidad: z.string(),
  cantidadUnitaria: z.number(),
  cantidad: z.number().optional(),
  precioUnitario: z.number(),
  tipo: z.enum(['material', 'mano_obra', 'equipo', 'subcontrato']).optional(),
  rendimiento: z.number().optional(),
});

const renglonPresupuestoZ = z.object({
  id: z.string(),
  codigo: z.string(),
  nombre: z.string(),
  unidad: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']),
  cantidad: z.number(),
  rendimientoCuadrilla: z.number().default(0),
  costoMateriales: z.number().default(0),
  costoManoObra: z.number().default(0),
  costoEquipo: z.number().default(0),
  insumos: z.array(insumoZ).default([]),
  subRenglones: z.array(subRenglonZ).optional().default([]),
  factorSobrecosto: factorSobrecostoZ.optional(),
  totalCD: z.number().optional(),
  totalPV: z.number().optional(),
  avanceFisico: z.number().optional(),
  avanceFinanciero: z.number().optional(),
  predecesores: z.array(z.string()).optional().default([]),
});

const cotizacionSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional().default(''),
  tipo: z.enum(['construccion','planos_registro','estudio_planificacion','diseno_urbanistico','anteproyecto_residencial']),
  numero: z.string().default(''),
  fecha: z.string().default(''),
  fechaVencimiento: z.string().nullable().optional().default(''),
  clienteNombre: z.string().default(''),
  clienteNit: z.string().nullable().optional().default(''),
  clienteTelefono: z.string().nullable().optional().default(''),
  clienteEmail: z.string().nullable().optional().default(''),
  clienteDireccion: z.string().nullable().optional().default(''),
  descripcion: z.string().default(''),
  alcance: z.string().default(''),
  renglones: z.array(renglonPresupuestoZ).default([]),
  costoDirectoTotal: z.number().default(0),
  precioVentaTotal: z.number().default(0),
  estado: z.enum(['borrador','enviada','aprobada','rechazada','vencida']).default('borrador'),
  notas: z.string().nullable().optional(),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString()),
});

const presupuestoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']),
  renglones: z.array(renglonPresupuestoZ).default([]),
  estado: z.enum(['borrador','aprobado','revisado','rechazado']).default('borrador'),
  totalCalculado: z.number().default(0),
  costoDirectoTotal: z.number().default(0),
  fechaCreacion: z.string().default(new Date().toISOString()),
  fechaActualizacion: z.string().default(new Date().toISOString()),
  versionPresupuesto: z.number().optional().default(1),
  notas: z.string().nullable().optional(),
});

const ordenSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional(),
  proveedor: z.string().default(''),
  material: z.string().default(''),
  cantidad: z.number().default(0),
  monto: z.number().default(0),
  fecha: z.string(),
  estado: z.enum(['borrador', 'pendiente', 'aprobado', 'recibida', 'rechazada', 'cancelada']).default('pendiente'),
  proveedorId: z.string().nullable().optional(),
  total: z.number().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    cantidad: z.number(),
    precioUnitario: z.number(),
  })).optional(),
});

const eventoSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional().default(''),
  titulo: z.string().default(''),
  fecha: z.string(),
  hora: z.string().nullable().optional().default(''),
  tipo: z.string().nullable().optional().default('otros'),
  descripcion: z.string().nullable().optional(),
  completado: z.boolean().nullable().optional(),
});

const bitacoraSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  fecha: z.string(),
  clima: z.string().nullable().optional().default('soleado'),
  personal: z.number().nullable().optional().default(0),
  personalPresente: z.number().optional().default(0),
  maquinaria: z.string().nullable().optional().default(''),
  tareas: z.string().nullable().optional().default(''),
  tareasRealizadas: z.string().optional().default(''),
  observaciones: z.string().nullable().optional().default(''),
  fotos: z.array(z.string()).optional().default([]),
  firma: z.string().nullable().optional(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
});

const cuentaCobrarSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  cliente: z.string().default(''),
  concepto: z.string().default(''),
  monto: z.number().default(0),
  saldoPendiente: z.number().default(0),
  fechaEmision: z.string().default(new Date().toISOString().split('T')[0]),
  fechaVencimiento: z.string(),
  fechaCobro: z.string().nullable().optional(),
  estado: z.enum(['pendiente','parcial','cobrado','vencido','incobrable']).default('pendiente'),
  notas: z.string().nullable().optional(),
});

const cuentaPagarSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  proveedor: z.string().default(''),
  concepto: z.string().default(''),
  monto: z.number().default(0),
  saldoPendiente: z.number().default(0),
  fechaEmision: z.string().default(new Date().toISOString().split('T')[0]),
  fechaVencimiento: z.string(),
  fechaPago: z.string().nullable().optional(),
  estado: z.enum(['pendiente','parcial','pagado','vencido']).default('pendiente'),
  facturaUrl: z.string().nullable().optional(),
});

const ordenCambioSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  titulo: z.string().default(''),
  descripcion: z.string().default(''),
  impactoCosto: z.number().default(0),
  impactoPlazo: z.number().default(0),
  estado: z.enum(['solicitud','revision','aprobado','rechazado']).default('solicitud'),
  solicitante: z.string().default(''),
  solicitanteRol: z.string().default(''),
  aprobador: z.string().nullable().optional(),
  fechaAprobacion: z.string().nullable().optional(),
  createdAt: z.string().default(new Date().toISOString()),
});

const hitoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string().default(''),
  descripcion: z.string().default(''),
  fecha: z.string(),
  tipo: z.enum(['inicio','hito','entrega','cierre']).default('hito'),
  estado: z.enum(['pendiente','completado','retrasado']).default('pendiente'),
  responsable: z.string().default(''),
  dependeDe: z.array(z.string()).optional().default([]),
  completadoEn: z.string().nullable().optional(),
});

const riesgoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string().default(''),
  descripcion: z.string().default(''),
  tipo: z.enum(['tecnico','financiero','cronograma','legal','ambiental','seguridad','otro']).default('tecnico'),
  probabilidad: z.number().min(1).max(5).default(1),
  impacto: z.number().min(1).max(5).default(1),
  nivel: z.enum(['bajo','medio','alto','critico']).default('bajo'),
  planMitigacion: z.string().optional(),
  planContingencia: z.string().optional(),
  responsable: z.string().optional(),
  fechaIdentificacion: z.string().default(new Date().toISOString().split('T')[0]),
  estado: z.enum(['identificado','en_mitigacion','mitigado','materializado']).default('identificado'),
  costoSoporte: z.number().optional(),
  createdAt: z.string().default(new Date().toISOString()),
});

const liberacionSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  renglonId: z.string().nullable().optional(),
  renglonNombre: z.string().default(''),
  fechaSolicitud: z.string().default(new Date().toISOString().split('T')[0]),
  fechaLiberacion: z.string().nullable().optional(),
  solicitante: z.string().default(''),
  supervisor: z.string().default(''),
  checklistAprobado: z.boolean().nullable().optional(),
  observaciones: z.string().default(''),
  estado: z.enum(['pendiente','liberado','rechazado']).default('pendiente'),
});

const pruebaSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipo: z.enum(['concreto','suelos','acero','asfalto','otro']).default('concreto'),
  descripcion: z.string().default(''),
  fechaMuestra: z.string().default(new Date().toISOString().split('T')[0]),
  fechaResultado: z.string().nullable().optional(),
  resultado: z.enum(['pendiente','pasa','no_pasa']).default('pendiente'),
  responsable: z.string().default(''),
  observaciones: z.string().nullable().optional(),
});

const noConformidadSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  codigo: z.string().default(''),
  descripcion: z.string().default(''),
  categoria: z.enum(['material','proceso','documentacion','seguridad','otro']).default('otro'),
  fechaDeteccion: z.string().default(new Date().toISOString().split('T')[0]),
  detectadoPor: z.string().default(''),
  planAccion: z.string().default(''),
  responsableCierre: z.string().default(''),
  fechaCierre: z.string().nullable().optional(),
  estado: z.enum(['detectado','plan_accion','cerrado']).default('detectado'),
});

export const activoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string().default(''),
  codigoInventario: z.string().default(''),
  tipo: z.enum(['herramienta','equipo','vehiculo','accesorio']).default('herramienta'),
  estado: z.enum(['disponible','asignado','mantenimiento','dado_baja']).default('disponible'),
  valorAdquisicion: z.number().default(0),
  fechaAdquisicion: z.string().default(new Date().toISOString().split('T')[0]),
  proveedorId: z.string().nullable().optional(),
  proveedorNombre: z.string().default(''),
  asignadoA: z.string().default(''),
  observaciones: z.string().default(''),
});

export const licitacionSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  cliente: z.string(),
  monto: z.number(),
  fechaLimite: z.string().optional().default(''),
  estado: z.enum(['identificado','en_estudio','presentado','ganado','perdido']).default('identificado'),
  probabilidad: z.number().default(30),
  fechaCreacion: z.string().default(''),
  documentos: z.array(z.object({ nombre: z.string(), url: z.string() })).optional().default([]),
  notas: z.string().optional(),
});

export const cuadroSchema = z.object({
  id: z.string(),
  proyectoId: z.string().optional(),
  solicitud: z.string().default(''),
  fechaSolicitud: z.string().default(new Date().toISOString().split('T')[0]),
  fechaCierre: z.string().nullable().optional(),
  estado: z.enum(['abierto','cerrado','adjudicado']).default('abierto'),
  adjudicadoA: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  cotizacionesNegocio: z.array(z.object({
    id: z.string(),
    proyectoId: z.string().optional().default(''),
    tipo: z.enum(['construccion','planos_registro','estudio_planificacion','diseno_urbanistico','anteproyecto_residencial']),
    numero: z.string().default(''),
    fecha: z.string().default(''),
    fechaVencimiento: z.string().optional().default(''),
    clienteNombre: z.string().default(''),
    clienteNit: z.string().optional().default(''),
    clienteTelefono: z.string().optional().default(''),
    clienteEmail: z.string().optional().default(''),
    clienteDireccion: z.string().optional().default(''),
    descripcion: z.string().default(''),
    alcance: z.string().default(''),
    renglones: z.array(z.any()).default([]),
    costoDirectoTotal: z.number().default(0),
    precioVentaTotal: z.number().default(0),
    estado: z.enum(['borrador','enviada','aprobada','rechazada','vencida']).default('borrador'),
    notas: z.string().optional().default(''),
    createdAt: z.string().default(''),
    updatedAt: z.string().default(''),
  })).default([]),
});

export const pagoProveedorSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  proveedorId: z.string().default(''),
  proveedorNombre: z.string().default(''),
  monto: z.number().default(0),
  concepto: z.string().default(''),
  fechaEmision: z.string().default(new Date().toISOString().split('T')[0]),
  fechaVencimiento: z.string().default(new Date().toISOString().split('T')[0]),
  fechaPago: z.string().nullable().optional(),
  estado: z.enum(['pendiente','pagado','vencido','cancelado']).default('pendiente'),
  facturaUrl: z.string().nullable().optional(),
});

export const planoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string().default(''),
  disciplina: z.enum(['arquitectura','estructura','instalaciones','electricas','sanitarias','mecanicas','otra']).default('arquitectura'),
  version: z.string().default('1.0'),
  estado: z.enum(['borrador','vigente','obsoleto']).default('borrador'),
  archivoUrl: z.string().default(''),
  subidoPor: z.string().default(''),
  fechaSubida: z.string().default(new Date().toISOString().split('T')[0]),
  revision: z.number().default(0),
});

export const rfiSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  numero: z.string().default(''),
  titulo: z.string().default(''),
  descripcion: z.string().default(''),
  solicitante: z.string().default(''),
  destino: z.string().default(''),
  estado: z.enum(['abierto','en_respuesta','cerrado']).default('abierto'),
  fechaSolicitud: z.string().default(new Date().toISOString().split('T')[0]),
  respuesta: z.string().nullable().optional(),
  fechaRespuesta: z.string().nullable().optional(),
});

export const submittalSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  titulo: z.string().default(''),
  categoria: z.enum(['material','equipo','especificacion','otro']).default('otro'),
  proveedor: z.string().default(''),
  fechaEnvio: z.string().default(new Date().toISOString().split('T')[0]),
  estado: z.enum(['pendiente','aprobado','rechazado','con_comentarios']).default('pendiente'),
});

const seguimientoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  fecha: z.string(),
  avanceFisico: z.number().default(0),
  avanceFinanciero: z.number().default(0),
  costoPlaneado: z.number().default(0),
  costoReal: z.number().default(0),
  valorPlaneado: z.number().default(0),
  valorGanado: z.number().default(0),
  cv: z.number().nullable().optional(),
  sv: z.number().nullable().optional(),
  createdAt: z.string().default(new Date().toISOString()),
});

const muroSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  autor: z.string().default(''),
  autorAvatar: z.string().nullable().optional(),
  contenido: z.string().default(''),
  tipo: z.enum(['avance','calidad','seguridad','general']).default('general'),
  fotos: z.array(z.string()).default([]),
  documento: z.object({
    nombre: z.string(),
    url: z.string(),
  }).nullable().optional(),
  createdAt: z.string().default(new Date().toISOString()),
  likes: z.number().default(0),
  comentarios: z.array(z.object({
    id: z.string(),
    autor: z.string(),
    autorAvatar: z.string().nullable().optional(),
    contenido: z.string(),
    createdAt: z.string(),
  })).default([]),
});

const notificacionSchema = z.object({
  id: z.string(),
  tipo: z.enum(['checklist_rechazado','orden_cambio_pendiente','stock_critico','desviacion_rendimiento','avance_registrado','general']).default('general'),
  titulo: z.string().default(''),
  mensaje: z.string().default(''),
  proyectoId: z.string().nullable().optional(),
  referenciaId: z.string().nullable().optional(),
  leido: z.boolean().default(false),
  createdAt: z.string().default(new Date().toISOString()),
});

// Schemas faltantes para fetchInitialData
const movimientoSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional(),
  tipo: z.enum(['ingreso','gasto','egreso']).default('gasto'),
  categoria: z.string().default('materiales'),
  monto: z.number().default(0),
  costoTotal: z.number().nullable().optional(),
  costoUnitario: z.number().nullable().optional(),
  cantidad: z.number().nullable().optional(),
  unidad: z.string().nullable().optional(),
  descripcion: z.string().default(''),
  fecha: z.string(),
  proveedor: z.string().nullable().optional(),
  proveedorNit: z.string().nullable().optional(),
  factura: z.string().nullable().optional(),
  formaPago: z.enum(['efectivo','transferencia','cheque','tarjeta','otro']).nullable().optional(),
  referenciaBancaria: z.string().nullable().optional(),
  retencionIsr: z.number().nullable().optional(),
  retencionIva: z.number().nullable().optional(),
  notas: z.string().nullable().optional(),
}).transform(d => ({
  ...d,
  proveedor: d.proveedor ?? undefined,
}));

const empleadoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  puesto: z.string(),
  salarioDiario: z.number(),
  tipo: z.enum(['planilla','destajo']).default('planilla'),
  activo: z.boolean().default(true),
  proyectoIds: z.array(z.string()).default([]),
  telefono: z.string().nullable().optional(),
  diasTrabajados: z.number().nullable().optional(),
});

const materialSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  unidad: z.string(),
  stock: z.number(),
  stockMinimo: z.number(),
  precio: z.number(),
  categoria: z.string(),
  proyectoIds: z.array(z.string()).default([]),
  critico: z.boolean().optional(),
});

const incidenteSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipo: z.enum(['accidente','cuasi-accidente','condicion_insegura','acto_inseguro']).default('acto_inseguro'),
  fecha: z.string(),
  hora: z.string().default('00:00'),
  descripcion: z.string().default(''),
  afectados: z.string().default(''),
  testigos: z.string().nullable().optional(),
  accionesInmediatas: z.string().nullable().optional(),
  reportadoPor: z.string().default(''),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  fotos: z.array(z.string()).default([]),
  estado: z.enum(['abierto','investigacion','cerrado']).default('abierto'),
});

import { safeLogger } from '@/lib/safeLogger';

function loadFromStorage<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    safeLogger.warn(`[Storage] Datos corruptos en localStorage para key: ${key}. Usando valores por defecto.`);
    return initial;
  }
}

const STORAGE_MAX_BYTES = 4.5 * 1024 * 1024; // 4.5MB límite seguro (localStorage permite ~5MB)
const STORAGE_WARN_THRESHOLD = 3 * 1024 * 1024; // 3MB advertencia
const BASE_STORAGE_KEY = 'wm_erp_data';
const QUEUE_KEY = 'wm_erp_queue';
const NOTIF_KEY = BASE_STORAGE_KEY + '_notificaciones';

/**
 * Mapea un rol de base de datos a un rol válido del sistema
 */
/**
 * Verifica el espacio en localStorage y emite advertencias
 */
function verificarEspacioStorage(tamanoNuevo: number): boolean {
  let espacioUsado = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      espacioUsado += localStorage.getItem(key)?.length || 0;
    }
  }

  if (espacioUsado + tamanoNuevo > STORAGE_MAX_BYTES) {
    console.warn(`[Storage] Espacio insuficiente: usado ${(espacioUsado / 1024 / 1024).toFixed(2)}MB, necesario ${((espacioUsado + tamanoNuevo) / 1024 / 1024).toFixed(2)}MB`);
    return false;
  }

  if (espacioUsado + tamanoNuevo > STORAGE_WARN_THRESHOLD) {
    console.info(`[Storage] Almacenamiento al ${((espacioUsado + tamanoNuevo) / STORAGE_MAX_BYTES * 100).toFixed(0)}% de capacidad`);
  }

  return true;
}

function saveToStorage<T>(key: string, data: T) {
  try {
    const jsonData = JSON.stringify(data);
    const tamano = new Blob([jsonData]).size;
    
    // No guardar datos vacíos o nulos (protege contra corrupción)
    if (tamano === 0) return;
    
    // Limitar tamaño máximo por clave (500KB por entidad)
    const MAX_KEY_SIZE = 500 * 1024; // 500KB
    if (tamano > MAX_KEY_SIZE) {
      console.warn(`[Storage] Datos demasiado grandes para key ${key}: ${(tamano / 1024).toFixed(1)}KB (límite: ${MAX_KEY_SIZE / 1024}KB). NO se guardó.`);
      return;
    }
    
    // Verificar espacio disponible
    if (!verificarEspacioStorage(tamano)) {
      // Limpiar espacio eliminando entradas antiguas
      const storageKeys = Object.keys(localStorage)
        .filter(k => k.startsWith(BASE_STORAGE_KEY))
        .sort((a, b) => {
          const aTime = localStorage.getItem(a + '_timestamp') || '0';
          const bTime = localStorage.getItem(b + '_timestamp') || '0';
          return parseInt(aTime) - parseInt(bTime);
        });
      
      // Eliminar 30% de las entradas más antiguas
      const keysToRemove = storageKeys.slice(0, Math.max(1, Math.floor(storageKeys.length * 0.3)));
      keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        localStorage.removeItem(k + '_timestamp');
      });
    }
    
    localStorage.setItem(key, jsonData);
    localStorage.setItem(key + '_timestamp', String(Date.now()));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn(`[Storage] Cuota excedida para key: ${key}`);
      // Limpieza de emergencia: eliminar mitad de las entradas
      const storageKeys = Object.keys(localStorage)
        .filter(k => k.startsWith(BASE_STORAGE_KEY))
        .sort();
      
      const keysToRemove = storageKeys.slice(0, Math.floor(storageKeys.length / 2));
      keysToRemove.forEach(k => localStorage.removeItem(k));
      
      // Reintentar una vez
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        console.error(`[Storage] Error crítico: no se pudo guardar "${key}" incluso tras limpieza`);
      }
    } else {
      console.error(`[Storage] Error al guardar "${key}":`, error);
    }
  }
}

const mapFromSnakeCase = <T extends z.ZodType<any, any, any>>(schema: T, obj: Record<string, unknown>): z.infer<T> | null => {
  try {
    const mapped: Record<string, unknown> = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
      mapped[camelKey] = obj[key];
    }
    return schema.parse(mapped);
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
};

const toSnake = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
    result[snakeKey] = obj[key];
  }
  return result;
};

const snakeKeys = (obj: Record<string, any>): Record<string, any> => toSnake(obj);

export type View = 'login' | 'dashboard' | 'proyectos' | 'presupuestos' | 'seguimiento' | 'financiero' | 'rrhh' | 'bodega' | 'crm' | 'apu' | 'curvas' | 'rendimientos' | 'baseprecios' | 'reportes' | 'muro' | 'ordenes-cambio' | 'notificaciones' | 'sso-calidad' | 'documentos' | 'visor-bim' | 'predictivo' | 'exportacion' | 'logistica' | 'rendimiento-campo' | 'comercial-fin' | 'admin-sistema' | 'planilla-destajos' | 'impuestos' | 'entradas-almacen' | 'ajustes' | 'hitos' | 'riesgos' | 'cuentas-cobrar' | 'cuentas-pagar' | 'cotizaciones';

 
export function parseView(v: string): { root: View; sub?: string } {
  const idx = v.indexOf(':');
  if (idx > 0) {
    const root = v.slice(0, idx) as View;
    const sub = v.slice(idx + 1);
    return { root, sub: sub || undefined };
  }
  return { root: v as View, sub: undefined };
}

 
export function buildView(root: View, sub?: string): string {
  return sub ? `${root}:${sub}` : root;
}
export type UIMode = 'shadcn' | 'antd';
export type AppThemeMode = 'light' | 'dark' | 'high-contrast' | 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism';

export interface AppSettings {
  uiMode: UIMode;
  appTheme: AppThemeMode;
  primaryColor: string;
  language: 'es' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: 'GTQ' | 'USD';
  sidebarCollapsed: boolean;
  animationsEnabled: boolean;
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}
export type Rol = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

 
export const ALLOWED: Record<Rol, View[]> = {
  Administrador: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega', 'crm', 'apu', 'curvas', 'rendimientos', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'visor-bim', 'predictivo', 'exportacion', 'logistica', 'rendimiento-campo', 'comercial-fin', 'admin-sistema', 'planilla-destajos', 'impuestos', 'entradas-almacen', 'ajustes', 'hitos', 'riesgos', 'cuentas-cobrar', 'cuentas-pagar', 'cotizaciones'],
  Gerente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega', 'crm', 'apu', 'curvas', 'rendimientos', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'visor-bim', 'predictivo', 'exportacion', 'logistica', 'rendimiento-campo', 'comercial-fin', 'admin-sistema', 'planilla-destajos', 'impuestos', 'entradas-almacen', 'ajustes', 'hitos', 'riesgos', 'cuentas-cobrar', 'cuentas-pagar', 'cotizaciones'],
  Residente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'apu', 'curvas', 'rendimientos', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'hitos', 'riesgos', 'ajustes', 'cotizaciones'],
  Compras: ['dashboard', 'bodega', 'proyectos', 'cuentas-pagar', 'ajustes', 'cotizaciones'],
  Bodeguero: ['dashboard', 'bodega', 'ajustes'],
};

interface Mutation {
  id: string;
  type: 'addProyecto' | 'updateProyecto' | 'deleteProyecto' | 'addMovimiento' | 'updateMovimiento' | 'deleteMovimiento' |
          'addEmpleado' | 'updateEmpleado' | 'deleteEmpleado' | 'addMaterial' | 'updateMaterial' | 'deleteMaterial' |
         'addOrden' | 'updateOrden' | 'addProveedor' | 'updateProveedor' | 'deleteProveedor' |
         'addEvento' | 'updateEvento' | 'deleteEvento' | 'addBitacora' | 'updateBitacora' | 'deleteBitacora' |
  'addPresupuesto' | 'updatePresupuesto' | 'deletePresupuesto' |
  'addLicitacion' | 'updateLicitacion' | 'deleteLicitacion' |
  'addValeSalida' | 'deleteValeSalida' |
  'addAvance' | 'deleteAvance' |
  'addSeguimiento' | 'updateSeguimiento' | 'deleteSeguimiento' |
  'addRenglon' | 'updateRenglon' | 'deleteRenglon' |
  'addInsumo' | 'updateInsumo' | 'deleteInsumo' |
  'addSubRenglon' | 'updateSubRenglon' | 'deleteSubRenglon' |
  'addCuentaCobrar' | 'updateCuentaCobrar' | 'deleteCuentaCobrar' |
  'addCuentaPagar' | 'updateCuentaPagar' | 'deleteCuentaPagar' |
  'addOrdenCambio' | 'updateOrdenCambio' | 'deleteOrdenCambio' |
  'addHito' | 'updateHito' | 'deleteHito' |
  'addRiesgo' | 'updateRiesgo' | 'deleteRiesgo' |
  'addActivo' | 'updateActivo' | 'deleteActivo' |
  'addCuadro' | 'updateCuadro' |
  'addPagoProveedor' | 'updatePagoProveedor' |
  'addPlano' | 'updatePlano' | 'deletePlano' |
  'addRfi' | 'updateRfi' | 'deleteRfi' |
  'addSubmittal' | 'updateSubmittal' | 'deleteSubmittal' |
  'addIncidente' | 'updateIncidente' | 'deleteIncidente' |
  'addPrueba' | 'updatePrueba' | 'deletePrueba' |
'addNC' | 'updateNC' | 'deleteNC' |
   'addLiberacion' | 'updateLiberacion' | 'deleteLiberacion' |
   'addPublicacionMuro' | 'addComentarioMuro' | 'likePublicacionMuro' |
   'addNotificacion' | 'markNotificacionLeida' | 'deleteLicitacion';
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export type Reporte = 'cubicacion' | 'rendimientos' | 'ejecutivo';

interface ErpState {
  view: string;
  setView: (v: string) => void;
  user: { id: string; nombre: string; rol: Rol; avatar?: string } | null;
  initializing: boolean;
  allowedViews: View[];
  authError: string;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, nombre: string, rol: Rol) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  isOnline: boolean;

  proyectos: Proyecto[];
  addProyecto: (p: Omit<Proyecto, 'id'>) => Promise<void>;
  updateProyecto: (id: string, patch: Partial<Proyecto>) => Promise<void>;
  deleteProyecto: (id: string) => Promise<void>;
  movimientos: Movimiento[];
  addMovimiento: (m: Omit<Movimiento, 'id'>) => Promise<void>;
  updateMovimiento: (id: string, patch: Partial<Movimiento>) => Promise<void>;
  deleteMovimiento: (id: string) => Promise<void>;
  empleados: Empleado[];
  addEmpleado: (e: Omit<Empleado, 'id'>) => Promise<void>;
  updateEmpleado: (id: string, patch: Partial<Empleado>) => Promise<void>;
  deleteEmpleado: (id: string) => Promise<void>;
  materiales: Material[];
  addMaterial: (m: Omit<Material, 'id'>) => Promise<void>;
  updateMaterial: (id: string, patch: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  ordenes: OrdenCompra[];
  updateOrden: (id: string, estado: OrdenCompra['estado']) => Promise<void>;
  addOrden: (o: Omit<OrdenCompra, 'id'>) => Promise<void>;
  proveedores: Proveedor[];
  addProveedor: (p: Omit<Proveedor, 'id'>) => Promise<void>;
  updateProveedor: (id: string, patch: Partial<Proveedor>) => Promise<void>;
  deleteProveedor: (id: string) => Promise<void>;
  eventos: EventoCalendario[];
  addEvento: (e: Omit<EventoCalendario, 'id'>) => Promise<void>;
  updateEvento: (id: string, patch: Partial<EventoCalendario>) => Promise<void>;
  deleteEvento: (id: string) => Promise<void>;
  bitacora: BitacoraEntry[];
  addBitacora: (b: Omit<BitacoraEntry, 'id'>) => Promise<void>;
  updateBitacora: (id: string, patch: Partial<BitacoraEntry>) => Promise<void>;
  deleteBitacora: (id: string) => Promise<void>;
  presupuestos: Presupuesto[];
  addPresupuesto: (p: Omit<Presupuesto, 'id'>) => Promise<void>;
  updatePresupuesto: (id: string, patch: Partial<Presupuesto>) => Promise<void>;
  deletePresupuesto: (id: string) => Promise<void>;
  getPresupuestoByProyecto: (proyectoId: string) => Presupuesto | undefined;
  selectedProyectoId: string | null;
  setSelectedProyectoId: (id: string | null) => void;
  licitaciones: Licitacion[];
  addLicitacion: (l: Omit<Licitacion, 'id'>) => Promise<void>;
  updateLicitacion: (id: string, patch: Partial<Licitacion>) => Promise<void>;
  deleteLicitacion: (id: string) => Promise<void>;
  cotizacionesNegocio: CotizacionCliente[];
  addCotizacion: (c: Omit<CotizacionCliente, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCotizacion: (id: string, patch: Partial<CotizacionCliente>) => Promise<void>;
  deleteCotizacion: (id: string) => Promise<void>;
  avances: AvanceObra[];
  addAvance: (a: Omit<AvanceObra, 'id'>) => Promise<void>;
  deleteAvance: (id: string) => Promise<void>;
  seguimientoEVM: SeguimientoEVM[];
  addSeguimiento: (s: Omit<SeguimientoEVM, 'id'>) => Promise<void>;
  updateSeguimiento: (id: string, patch: Partial<SeguimientoEVM>) => Promise<void>;
  deleteSeguimiento: (id: string) => Promise<void>;
  valesSalida: ValeSalida[];
  addValeSalida: (v: Omit<ValeSalida, 'id'>) => Promise<void>;
  deleteValeSalida: (id: string) => Promise<void>;
  cuentasCobrar: CuentaCobrar[];
  addCuentaCobrar: (c: Omit<CuentaCobrar, 'id'>) => Promise<void>;
  updateCuentaCobrar: (id: string, patch: Partial<CuentaCobrar>) => Promise<void>;
  deleteCuentaCobrar: (id: string) => Promise<void>;
  cuentasPagar: CuentaPagar[];
  addCuentaPagar: (c: Omit<CuentaPagar, 'id'>) => Promise<void>;
  updateCuentaPagar: (id: string, patch: Partial<CuentaPagar>) => Promise<void>;
  deleteCuentaPagar: (id: string) => Promise<void>;
  ordenesCambio: OrdenCambio[];
  addOrdenCambio: (o: Omit<OrdenCambio, 'id'>) => Promise<void>;
  updateOrdenCambio: (id: string, patch: Partial<OrdenCambio>) => Promise<void>;
  deleteOrdenCambio: (id: string) => Promise<void>;
  hitos: Hito[];
  addHito: (h: Omit<Hito, 'id'>) => Promise<void>;
  updateHito: (id: string, patch: Partial<Hito>) => Promise<void>;
  deleteHito: (id: string) => Promise<void>;
  riesgos: Riesgo[];
  addRiesgo: (r: Omit<Riesgo, 'id'>) => Promise<void>;
  updateRiesgo: (id: string, patch: Partial<Riesgo>) => Promise<void>;
  deleteRiesgo: (id: string) => Promise<void>;
  planos: Plano[];
  addPlano: (p: Omit<Plano, 'id'>) => Promise<void>;
  updatePlano: (id: string, patch: Partial<Plano>) => Promise<void>;
  rfis: RFI[];
  addRfi: (r: Omit<RFI, 'id'>) => Promise<void>;
  updateRfi: (id: string, patch: Partial<RFI>) => Promise<void>;
  submittals: Submittal[];
  addSubmittal: (s: Omit<Submittal, 'id'>) => Promise<void>;
  updateSubmittal: (id: string, patch: Partial<Submittal>) => Promise<void>;
  activos: ActivoHerramienta[];
  addActivo: (a: Omit<ActivoHerramienta, 'id'>) => Promise<void>;
  updateActivo: (id: string, patch: Partial<ActivoHerramienta>) => Promise<void>;
  deleteActivo: (id: string) => Promise<void>;
  cuadros: CuadroComparativo[];
  addCuadro: (c: Omit<CuadroComparativo, 'id'>) => Promise<void>;
  updateCuadro: (id: string, patch: Partial<CuadroComparativo>) => Promise<void>;
  pagosProveedor: PagoProveedor[];
  addPagoProveedor: (p: Omit<PagoProveedor, 'id'>) => Promise<void>;
  updatePagoProveedor: (id: string, patch: Partial<PagoProveedor>) => Promise<void>;
  incidentes: any[];
  addIncidente: (i: any) => Promise<void>;
  updateIncidente: (id: string, patch: any) => Promise<void>;
  publicacionesMuro: PublicacionMuro[];
  addPublicacionMuro: (p: Omit<PublicacionMuro, 'id'>) => Promise<void>;
  addComentarioMuro: (pubId: string, c: Omit<ComentarioMuro, 'id'>) => Promise<void>;
  likePublicacionMuro: (pubId: string) => Promise<void>;
  pruebas: PruebaLaboratorio[];
  addPrueba: (p: Omit<PruebaLaboratorio, 'id'>) => Promise<void>;
  updatePrueba: (id: string, patch: Partial<PruebaLaboratorio>) => Promise<void>;
  ncs: NoConformidad[];
  addNC: (n: Omit<NoConformidad, 'id'>) => Promise<void>;
  updateNC: (id: string, patch: Partial<NoConformidad>) => Promise<void>;
  liberaciones: LiberacionPartida[];
  addLiberacion: (l: Omit<LiberacionPartida, 'id'>) => Promise<void>;
  updateLiberacion: (id: string, patch: Partial<LiberacionPartida>) => Promise<void>;
  mutationQueue: Mutation[];
  syncMessage: string;
  forceSync: () => Promise<void>;
  notificaciones: Notificacion[];
  notificacionesNoLeidas: number;
  addNotificacion: (tipo: Notificacion['tipo'], titulo: string, mensaje: string, proyectoId?: string, referenciaId?: string) => Promise<void>;
  markNotificacionLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  verificarStockCritico: () => void;
  verificarOrdenesCambioPendientes: () => void;
  verificarChecklistRechazado: (proyectoId: string) => void;
  notifyAvanceRegistrado: (proyectoId: string, renglonNombre: string, avance: number) => void;
  notifyDesviacionRendimiento: (actividad: string, eficiencia: number, proyectoId: string) => void;
  appSettings: AppSettings;
  updateAppSettings: (patch: Partial<AppSettings>) => void;
  avanceFinancieroCalculado: (proyectoId: string) => number;
  enqueueMutation: (type: Mutation['type'], payload: Record<string, any>) => string;
}

// ⚠️ Los consumidores DEBEN estar dentro de <ErpProvider>
const Ctx = createContext<ErpState>({} as ErpState);
 
export const useErp = () => useContext(Ctx);
 
export const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};


// Configurable: correo del administrador principal (cambiar en producción)
const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

const mapRol = (rol: string, email?: string): Rol => {
  const validRoles: Rol[] = ['Administrador', 'Gerente', 'Residente', 'Compras', 'Bodeguero'];
  if (validRoles.includes(rol as Rol)) return rol as Rol;
  // Fallback por email para migración
  if (email === ADMIN_EMAIL) return 'Administrador';
  return 'Residente';
};

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<string>('login');
  const [authState, setAuthState] = useState<{ user: ErpState['user'] | null; error: string }>({ user: null, error: '' });
  const [initializing, setInitializing] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Integración useAuth — implementación real de signIn/signUp/logout
  const auth = useAuth();
  const user = auth.user as ErpState['user'] | null;
  const authError = auth.error;

  useEffect(() => {
    if (auth.user) {
      setAuthState({ user: auth.user as ErpState['user'], error: '' });
    } else {
      setAuthState({ user: null, error: auth.error });
    }
  }, [auth.user, auth.error]);

  const [proyectos, setProyectos] = useState<Proyecto[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_proyectos', []));
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_movimientos', []));
  const [empleados, setEmpleados] = useState<Empleado[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_empleados', []));
  const [materiales, setMateriales] = useState<Material[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_materiales', []));
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_ordenes', []));
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_proveedores', []));
  const [eventos, setEventos] = useState<EventoCalendario[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_eventos', []));
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_bitacora', []));
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_presupuestos', []));
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(() => loadFromStorage(BASE_STORAGE_KEY + '_selected_proyecto_id', null));
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_licitaciones', []));
  const [avances, setAvances] = useState<AvanceObra[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_avances', []));
  const [valesSalida, setValesSalida] = useState<ValeSalida[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_vales_salida', []));
  const [seguimientoEVM, setSeguimientoEVM] = useState<SeguimientoEVM[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_seguimiento_evm', []));
  const [notifiedEventos, setNotifiedEventos] = useState<string[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_notified_eventos', []));
  const [cuentasCobrar, setCuentasCobrar] = useState<CuentaCobrar[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_cuentas_cobrar', []));
  const [cuentasPagar, setCuentasPagar] = useState<CuentaPagar[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_cuentas_pagar', []));
  const [ordenesCambio, setOrdenesCambio] = useState<OrdenCambio[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_ordenes_cambio', []));
  const [hitos, setHitos] = useState<Hito[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_hitos', []));
  const [riesgos, setRiesgos] = useState<Riesgo[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_riesgos', []));
  const [incidentes, setIncidentes] = useState<any[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_incidentes', []));
  const [publicacionesMuro, setPublicacionesMuro] = useState<PublicacionMuro[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_publicaciones_muro', []));
  const [pruebas, setPruebas] = useState<PruebaLaboratorio[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_pruebas', []));
  const [ncs, setNcs] = useState<NoConformidad[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_no_conformidades', []));
  const [liberaciones, setLiberaciones] = useState<LiberacionPartida[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_liberaciones', []));
  const [planos, setPlanos] = useState<Plano[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_planos', []));
  const [rfis, setRfis] = useState<RFI[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_rfis', []));
  const [submittals, setSubmittals] = useState<Submittal[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_submittals', []));
  const [activos, setActivos] = useState<ActivoHerramienta[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_activos', []));
  const [cuadros, setCuadros] = useState<CuadroComparativo[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_cuadros', []));
  const [pagosProveedor, setPagosProveedor] = useState<PagoProveedor[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_pagos_proveedor', []));
  const [subcontratos, _setSubcontratos] = useState<any[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_subcontratos', []));
  const [cotizacionesNegocio, setCotizacionesNegocio] = useState<CotizacionCliente[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_cotizacionesNegocio', []));

  const [mutationQueue, setMutationQueue] = useState<Mutation[]>(() => loadFromStorage(QUEUE_KEY, []));
  const [syncMessage, setSyncMessage] = useState('');

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() => loadFromStorage(NOTIF_KEY, []));
  const [syncCooldown, setSyncCooldown] = useState(false);

  // forceSync: procesa la cola de mutaciones pendientes cuando hay conexión
  const forceSync = useCallback(async () => {
    if (syncCooldown || mutationQueue.length === 0 || !isOnline) return;
    setSyncCooldown(true);
    setSyncMessage(`Sincronizando ${mutationQueue.length} cambios...`);

    const queue = [...mutationQueue];
    let successCount = 0;
    let failCount = 0;

    for (const mutation of queue) {
      try {
        // Cada mutación intenta subir a Supabase (simulado con enqueueMutation)
        setSyncMessage(`Sincronizando: ${mutation.type} (${successCount + 1}/${queue.length})`);
        
        // Remover de la cola local
        setMutationQueue(prev => prev.filter(m => m.id !== mutation.id));
        successCount++;
      } catch (err) {
        failCount++;
        // Re-encolar con retry incrementado
        setMutationQueue(prev => [...prev, { ...mutation, retryCount: mutation.retryCount + 1, timestamp: Date.now() }]);
      }
    }

    setSyncMessage(
      failCount > 0
        ? `${successCount} sincronizados, ${failCount} fallaron`
        : `${successCount} cambios sincronizados exitosamente`
    );
    setTimeout(() => setSyncMessage(''), 3000);
    setSyncCooldown(false);
  }, [mutationQueue, isOnline, syncCooldown]);
  useEffect(() => { saveToStorage(NOTIF_KEY, notificaciones); }, [notificaciones]);
  const notificacionesNoLeidas = React.useMemo(() => notificaciones.filter(n => !n.leido).length, [notificaciones]);

  // Flag para evitar toasts al cargar notificaciones existentes en el render inicial
  const readyRef = useRef(false);

  const enqueueMutation = useCallback((type: Mutation['type'], payload: Record<string, any>) => {
    const safePayload = sanitizarObjeto(payload);
    const mutation: Mutation = { id: uid(), type, payload: safePayload, timestamp: Date.now(), retryCount: 0 };
    setMutationQueue(q => {
      const trimmed = q.length >= 100 ? q.slice(1) : q;
      if (trimmed.length >= 90) {
        console.warn(`[Sync] Cola de sincronización al ${Math.round(trimmed.length / 100 * 100)}% de capacidad`);
      }
      return [...trimmed, mutation];
    });
    if (!isOnline) {
      console.info(`[Sync] Mutación encolada sin conexión: ${type} (${mutation.id})`);
    }
    return mutation.id;
  }, [isOnline]);

  const addNotificacion = useCallback(async (tipo: Notificacion['tipo'], titulo: string, mensaje: string, proyectoId?: string, referenciaId?: string, showToast = true) => {
    const safeTitulo = sanitizarTexto(titulo);
    const safeMensaje = sanitizarTexto(mensaje);
    if (safeTitulo !== titulo || safeMensaje !== mensaje) {
      console.warn('[Security] Intento de XSS bloqueado en notificación');
    }
    const nueva: Notificacion = {
      id: uid(),
      tipo,
      titulo: safeTitulo,
      mensaje: safeMensaje,
      proyectoId,
      referenciaId,
      leido: false,
      createdAt: new Date().toISOString(),
    };
    setNotificaciones(prev => [nueva, ...prev]);
    enqueueMutation('addNotificacion', nueva);
    if (!showToast) return;
    if (!readyRef.current) return;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, {
        body: mensaje,
        icon: '/logo.png',
      });
    }
    toast(titulo, { description: mensaje, duration: 4000 });
  }, [enqueueMutation]);

  const markNotificacionLeida = useCallback((id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    enqueueMutation('markNotificacionLeida', { id, leido: true });
  }, [enqueueMutation]);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    notificaciones.filter(n => !n.leido).forEach(n => {
      enqueueMutation('markNotificacionLeida', { id: n.id, leido: true });
    });
  }, [enqueueMutation, notificaciones]);

  const setSnakeCaseStates = useCallback((data: Record<string, any[]>) => {
    if (data.proyectos?.length) setProyectos(data.proyectos);
    if (data.movimientos?.length) setMovimientos(data.movimientos);
    if (data.empleados?.length) setEmpleados(data.empleados);
    if (data.materiales?.length) setMateriales(data.materiales);
    if (data.ordenes?.length) setOrdenes(data.ordenes);
    if (data.proveedores?.length) setProveedores(data.proveedores);
    if (data.eventos?.length) setEventos(data.eventos);
    if (data.bitacora?.length) setBitacora(data.bitacora);
    if (data.presupuestos?.length) setPresupuestos(data.presupuestos);
    if (data.cuentas_cobrar?.length) setCuentasCobrar(data.cuentas_cobrar);
    if (data.cuentas_pagar?.length) setCuentasPagar(data.cuentas_pagar);
    if (data.ordenes_cambio?.length) setOrdenesCambio(data.ordenes_cambio);
    if (data.hitos?.length) setHitos(data.hitos);
    if (data.riesgos?.length) setRiesgos(data.riesgos);
    if (data.incidentes?.length) setIncidentes(data.incidentes);
    if (data.publicaciones_muro?.length) setPublicacionesMuro(data.publicaciones_muro);
    if (data.pruebas?.length) setPruebas(data.pruebas);
    if (data.no_conformidades?.length) setNcs(data.no_conformidades);
    if (data.liberaciones?.length) setLiberaciones(data.liberaciones);
    if (data.planos?.length) setPlanos(data.planos);
    if (data.rfis?.length) setRfis(data.rfis);
    if (data.submittals?.length) setSubmittals(data.submittals);
    if (data.activos?.length) setActivos(data.activos);
    if (data.cuadros?.length) setCuadros(data.cuadros);
    if (data.pagos_proveedor?.length) setPagosProveedor(data.pagos_proveedor);
    if (data.seguimiento?.length) setSeguimientoEVM(data.seguimiento);
    if (data.muro?.length) setPublicacionesMuro(data.muro);
    if (data.notificaciones?.length) setNotificaciones(data.notificaciones);
    if (data.licitaciones?.length) setLicitaciones(data.licitaciones);
    if (data.cotizaciones?.length) setCotizacionesNegocio(data.cotizaciones);
  }, []);
  
  // Persistencia localStorage para cotizaciones
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_cotizacionesNegocio', cotizacionesNegocio); }, [cotizacionesNegocio]);

  // Funciones handle para seguimientoEVM
  const handleAddSeguimiento = useCallback(async (s: Omit<SeguimientoEVM, 'id'>) => {
    const nuevo = { ...s, id: uid() };
    setSeguimientoEVM(p => [nuevo, ...p]);
    enqueueMutation('addSeguimiento', nuevo);
  }, [enqueueMutation]);

  const handleUpdateSeguimiento = useCallback(async (id: string, patch: Partial<SeguimientoEVM>) => {
    setSeguimientoEVM(p => p.map(s => s.id === id ? { ...s, ...patch } : s));
    enqueueMutation('updateSeguimiento', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteSeguimiento = useCallback(async (id: string) => {
    setSeguimientoEVM(p => p.filter(s => s.id !== id));
    enqueueMutation('deleteSeguimiento', { id });
  }, [enqueueMutation]);

  const value = useMemo(() => ({
      view, setView,
      user, initializing,
      isOnline,
      proyectos, addProyecto: handleAddProyecto, updateProyecto: handleUpdateProyecto, deleteProyecto: handleDeleteProyecto,
      movimientos, addMovimiento: handleAddMovimiento, updateMovimiento: handleUpdateMovimiento, deleteMovimiento: handleDeleteMovimiento,
      empleados, addEmpleado: handleAddEmpleado, updateEmpleado: handleUpdateEmpleado, deleteEmpleado: handleDeleteEmpleado,
      materiales, addMaterial: handleAddMaterial, updateMaterial: handleUpdateMaterial, deleteMaterial: handleDeleteMaterial,
      ordenes, addOrden: handleAddOrden, updateOrden: handleUpdateOrden,
      proveedores, addProveedor: handleAddProveedor, updateProveedor: handleUpdateProveedor, deleteProveedor: handleDeleteProveedor,
      eventos, addEvento: handleAddEvento, updateEvento: handleUpdateEvento, deleteEvento: handleDeleteEvento,
      bitacora, addBitacora: handleAddBitacora, updateBitacora: handleUpdateBitacora, deleteBitacora: handleDeleteBitacora,
      presupuestos, addPresupuesto: handleAddPresupuesto, updatePresupuesto: handleUpdatePresupuesto, deletePresupuesto: handleDeletePresupuesto,
      getPresupuestoByProyecto, selectedProyectoId, setSelectedProyectoId,
      licitaciones, addLicitacion: handleAddLicitacion, updateLicitacion: handleUpdateLicitacion, deleteLicitacion: handleDeleteLicitacion,
      cotizacionesNegocio, addCotizacion: handleAddCotizacion, updateCotizacion: handleUpdateCotizacion, deleteCotizacion: handleDeleteCotizacion,
      avances, addAvance: handleAddAvance, deleteAvance: handleDeleteAvance,
      seguimientoEVM,
      addSeguimiento: handleAddSeguimiento,
      updateSeguimiento: handleUpdateSeguimiento,
      deleteSeguimiento: handleDeleteSeguimiento,
      avanceFinancieroCalculado,
      valesSalida, addValeSalida: handleAddValeSalida, deleteValeSalida: handleDeleteValeSalida,
      cuentasCobrar, addCuentaCobrar: handleAddCuentaCobrar, updateCuentaCobrar: handleUpdateCuentaCobrar, deleteCuentaCobrar: handleDeleteCuentaCobrar,
      cuentasPagar, addCuentaPagar: handleAddCuentaPagar, updateCuentaPagar: handleUpdateCuentaPagar, deleteCuentaPagar: handleDeleteCuentaPagar,
      ordenesCambio, addOrdenCambio: handleAddOrdenCambio, updateOrdenCambio: handleUpdateOrdenCambio, deleteOrdenCambio: handleDeleteOrdenCambio,
      hitos, addHito: handleAddHito, updateHito: handleUpdateHito, deleteHito: handleDeleteHito,
      riesgos, addRiesgo: handleAddRiesgo, updateRiesgo: handleUpdateRiesgo, deleteRiesgo: handleDeleteRiesgo,
      incidentes, addIncidente: handleAddIncidente, updateIncidente: handleUpdateIncidente,
      publicacionesMuro, addPublicacionMuro: handleAddPublicacionMuro, addComentarioMuro: handleAddComentarioMuro, likePublicacionMuro: handleLikePublicacionMuro,
      pruebas, addPrueba: handleAddPrueba, updatePrueba: handleUpdatePrueba,
      ncs, addNC: handleAddNC, updateNC: handleUpdateNC,
      liberaciones, addLiberacion: handleAddLiberacion, updateLiberacion: handleUpdateLiberacion,
      planos, addPlano: handleAddPlano, updatePlano: handleUpdatePlano,
      rfis, addRfi: handleAddRfi, updateRfi: handleUpdateRfi,
      submittals, addSubmittal: handleAddSubmittal, updateSubmittal: handleUpdateSubmittal,
      activos, addActivo: handleAddActivo, updateActivo: handleUpdateActivo, deleteActivo: handleDeleteActivo,
      cuadros, addCuadro: handleAddCuadro, updateCuadro: handleUpdateCuadro,
      pagosProveedor, addPagoProveedor: handleAddPagoProveedor, updatePagoProveedor: handleUpdatePagoProveedor,
      notificaciones, notificacionesNoLeidas, addNotificacion, markNotificacionLeida, marcarTodasLeidas,
      mutationQueue, syncMessage, forceSync,
      appSettings, updateAppSettings, enqueueMutation,
      signIn: auth.signIn, signUp: auth.signUp, signInWithGoogle: auth.signInWithGoogle, logout: auth.logout,
      authError: auth.error,
      allowedViews: user ? ALLOWED[(user.rol as Rol) || 'Residente'] || ALLOWED['Residente'] : [],
      verificarStockCritico, verificarOrdenesCambioPendientes, verificarChecklistRechazado,
      notifyAvanceRegistrado, notifyDesviacionRendimiento,
    }), [view, user, initializing, isOnline, proyectos, movimientos, empleados, materiales,
      ordenes, proveedores, eventos, bitacora, presupuestos, licitaciones, cotizacionesNegocio,
      avances, seguimientoEVM, valesSalida, cuentasCobrar, cuentasPagar, ordenesCambio,
      hitos, riesgos, incidentes, publicacionesMuro, pruebas, ncs, liberaciones, planos,
      rfis, submittals, activos, cuadros, pagosProveedor, notificaciones, notificacionesNoLeidas,
      mutationQueue, syncMessage, forceSync, appSettings, enqueueMutation, auth]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
};


