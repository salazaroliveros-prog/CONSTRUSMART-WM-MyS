import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { sanitizarObjeto, sanitizarTexto, getServerRole } from '@/lib/security';
// useSupabaseRealtime import removed - hook was commented out and causing issues
import { z } from 'zod';
import { toast } from '@/components/ui/sonner';
import {
  Proyecto, Movimiento, Empleado, Material, OrdenCompra, Proveedor, EventoCalendario, BitacoraEntry, Presupuesto, Licitacion, AvanceObra, ValeSalida, Notificacion, OrdenCambio, SeguimientoEVM,
  CuentaCobrar, CuentaPagar, Hito, Riesgo, PublicacionMuro, ComentarioMuro, PruebaLaboratorio, NoConformidad, LiberacionPartida,
  Plano, RFI, Submittal, ActivoHerramienta, CuadroComparativo, PagoProveedor,
} from './types';


// Zod schemas for validation — alineados con esquema real de Supabase y formulario
const proyectoSchema = z.object({
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

const presupuestoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']),
  renglones: z.array(z.record(z.unknown())).default([]),
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
  cotizaciones: z.array(z.object({
    id: z.string(),
    cuadroId: z.string(),
    proveedorId: z.string(),
    proveedorNombre: z.string(),
    montoTotal: z.number(),
    plazoEntrega: z.number().optional(),
    condicionesPago: z.string().optional(),
    validezOferta: z.string().optional(),
    seleccionada: z.boolean().default(false),
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

export type View = 'login' | 'dashboard' | 'proyectos' | 'presupuestos' | 'seguimiento' | 'financiero' | 'rrhh' | 'bodega' | 'crm' | 'apu' | 'curvas' | 'rendimientos' | 'baseprecios' | 'reportes' | 'muro' | 'ordenes-cambio' | 'notificaciones' | 'sso-calidad' | 'documentos' | 'visor-bim' | 'predictivo' | 'exportacion' | 'logistica' | 'rendimiento-campo' | 'comercial-fin' | 'admin-sistema' | 'planilla-destajos' | 'impuestos' | 'entradas-almacen' | 'ajustes' | 'hitos' | 'riesgos' | 'cuentas-cobrar' | 'cuentas-pagar';

 
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
  Administrador: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega', 'crm', 'apu', 'curvas', 'rendimientos', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'visor-bim', 'predictivo', 'exportacion', 'logistica', 'rendimiento-campo', 'comercial-fin', 'admin-sistema', 'planilla-destajos', 'impuestos', 'entradas-almacen', 'ajustes', 'hitos', 'riesgos', 'cuentas-cobrar', 'cuentas-pagar'],
  Gerente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega', 'crm', 'apu', 'curvas', 'rendimientos', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'visor-bim', 'predictivo', 'exportacion', 'logistica', 'rendimiento-campo', 'comercial-fin', 'admin-sistema', 'planilla-destajos', 'impuestos', 'entradas-almacen', 'ajustes', 'hitos', 'riesgos', 'cuentas-cobrar', 'cuentas-pagar'],
  Residente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'apu', 'curvas', 'rendimientos', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'hitos', 'riesgos', 'ajustes'],
  Compras: ['dashboard', 'bodega', 'proyectos', 'cuentas-pagar', 'ajustes'],
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
  const [user, setUser] = useState<ErpState['user']>(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

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

  const [mutationQueue, setMutationQueue] = useState<Mutation[]>(() => loadFromStorage(QUEUE_KEY, []));

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() => loadFromStorage(NOTIF_KEY, []));
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
  }, []);

  const safeFrom = async (table: string, queryModifier?: (q: any) => any) => {
    try {
      let q = supabase.from(table).select('*');
      if (queryModifier) q = queryModifier(q);
      const { data, error } = await q;
      if (error) {
        console.error(`[Sync] Fallo cargando ${table}:`, error);
        return [];
      }
      return data ?? [];
    } catch (err) {
      console.error(`[Sync] Exception cargando ${table}:`, err);
      return [];
    }
  };

  const fetchInitialData = useCallback(async () => {
    const simpleMap = (schema: z.ZodType<any, any, any>, data: any[]) => {
      if (!Array.isArray(data) || data.length === 0) return [];
      return data
        .map((obj: any) => {
          try {
            return schema.parse(obj);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    };

    const currentUser = user;
    if (!currentUser) return;
const [p, m, e, mat, o, prov, evt, bit, presup, _seg, cc, cp, oc, hit, rie, lib, pub, notif, inc, prue, nc, act, cua, pp, pl, rf, sub, licit] = await Promise.all([
       safeFrom('erp_proyectos'),
       safeFrom('erp_movimientos', q => q.select('*').order('fecha', { ascending: false })),
       safeFrom('erp_empleados'),
       safeFrom('erp_materiales'),
       safeFrom('erp_ordenes_compra', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_proveedores'),
       safeFrom('erp_eventos_calendario'),
       safeFrom('erp_bitacora', q => q.select('*').order('fecha', { ascending: false })),
       safeFrom('erp_presupuestos'),
       safeFrom('erp_seguimiento', q => q.select('*').order('fecha', { ascending: false })),
       safeFrom('erp_cuentas_cobrar', q => q.select('*').order('fecha_vencimiento', { ascending: true })),
       safeFrom('erp_cuentas_pagar', q => q.select('*').order('fecha_vencimiento', { ascending: true })),
       safeFrom('erp_ordenes_cambio', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_hitos', q => q.select('*').order('fecha', { ascending: true })),
       safeFrom('erp_riesgos', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_liberaciones_partida', q => q.select('*').order('fecha_solicitud', { ascending: false })),
       safeFrom('erp_muro', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_notificaciones', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_activos', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_cuadros', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_pagos_proveedor', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_planos', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_rfis', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_submittals', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_incidentes', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_pruebas_laboratorio', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_no_conformidades', q => q.select('*').order('created_at', { ascending: false })),
       safeFrom('erp_licitaciones', q => q.select('*').order('created_at', { ascending: false })),
     ]);

setSnakeCaseStates({
       proyectos: simpleMap(proyectoSchema, p),
       movimientos: simpleMap(movimientoSchema, m),
       empleados: simpleMap(empleadoSchema, e),
       materiales: simpleMap(materialSchema, mat),
       ordenes: simpleMap(ordenSchema, o),
       proveedores: simpleMap(proveedorSchema, prov),
       eventos: simpleMap(eventoSchema, evt),
       bitacora: simpleMap(bitacoraSchema, bit),
       presupuestos: simpleMap(presupuestoSchema, presup),
       cuentas_cobrar: simpleMap(cuentaCobrarSchema, cc),
       cuentas_pagar: simpleMap(cuentaPagarSchema, cp),
       ordenes_cambio: simpleMap(ordenCambioSchema, oc),
       hitos: simpleMap(hitoSchema, hit),
       riesgos: simpleMap(riesgoSchema, rie),
       incidentes: simpleMap(incidenteSchema, inc),
       pruebas: simpleMap(pruebaSchema, prue),
       no_conformidades: simpleMap(noConformidadSchema, nc),
       liberaciones: simpleMap(liberacionSchema, lib),
       planos: simpleMap(planoSchema, pl),
       rfis: simpleMap(rfiSchema, rf),
       submittals: simpleMap(submittalSchema, sub),
       activos: simpleMap(activoSchema, act),
       cuadros: simpleMap(cuadroSchema, cua),
       pagos_proveedor: simpleMap(pagoProveedorSchema, pp),
       seguimiento: simpleMap(seguimientoSchema, _seg),
       muro: simpleMap(muroSchema, pub),
       licitaciones: simpleMap(licitacionSchema, licit),
     });
  }, [setSnakeCaseStates, user]);

  const fetchInitialDataRef = useRef<(() => Promise<void>) | null>(null);
  fetchInitialDataRef.current = fetchInitialData;

  useEffect(() => {
    let mounted = true;
    let authLoaded = false;

    const loadProfile = async (id: string, email?: string, metadata?: { nombre?: string; avatar_url?: string; picture?: string }) => {
      if (authLoaded) return; // Prevenir ejecución duplicada
      authLoaded = true;
      // Profile loading...

      const defaultRol = email === ADMIN_EMAIL ? 'Administrador' as const : 'Residente' as const;
      const avatarFromMeta = metadata?.avatar_url || metadata?.picture;
      let nombreFinal = metadata?.nombre || email?.split('@')[0] || 'Usuario';
      let rolFinal = defaultRol;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nombre,rol,avatar_url')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) {
          nombreFinal = data.nombre;
          rolFinal = mapRol(data.rol, email);
        } else {
          await supabase.from('profiles').upsert(
            { id, nombre: nombreFinal, rol: defaultRol, avatar_url: avatarFromMeta },
            { onConflict: 'id', ignoreDuplicates: false }
          );
        }

        // Obtener rol verificado server-side
        const serverRole = await getServerRole();
        if (serverRole?.rol) {
          rolFinal = mapRol(serverRole.rol, email) as Rol;
        }
      } catch (err) {
        console.error('[Profile] Error cargando perfil:', err);
        // Usar valores por defecto
      }

      // Un SOLO setUser con todos los datos resueltos
      setUser({ id, nombre: nombreFinal, rol: rolFinal, avatar: avatarFromMeta });

      if (mounted) {
        setView('dashboard');
        setInitializing(false);
        fetchInitialDataRef.current();
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        const meta = session.user.user_metadata || {};
        loadProfile(session.user.id, session.user.email || undefined, { nombre: meta.full_name || meta.nombre, avatar_url: meta.picture || meta.avatar_url });
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setView('login'); setInitializing(false);
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    if (authCode) {
      // El SDK de Supabase maneja el callback OAuth cuando no se usa skipBrowserRedirect.
      // Solo limpiamos la URL para eliminar el código después de procesarlo.
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        loadProfile(data.session.user.id, data.session.user.email || undefined);
      } else {
        setInitializing(false);
      }
    }).catch((err: any) => {
      if (err?.message?.includes('Refresh Token') || err?.message?.includes('Invalid')) {
        // Token inválido - limpiar estado y redirigir a login
        setUser(null);
        setView('login');
      }
      console.error('[Auth] Error en getSession():', err);
      setInitializing(false);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []); // ← SIN fetchInitialData en deps, se usa ref

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRolRef = useRef<Rol | null>(null);

  useEffect(() => {
    if (!isOnline) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    if (!user?.id) return;
    const check = async () => {
      try {
        const serverRole = await getServerRole();
        if (serverRole?.rol && serverRole.rol !== lastRolRef.current) {
          lastRolRef.current = serverRole.rol as Rol;
          setUser(prev => prev ? { ...prev, rol: lastRolRef.current! } : prev);
        }
      } catch { /* silent */ }
    };
    check();
    intervalRef.current = setInterval(check, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isOnline, user?.id]); // ← SIN user?.rol: evita el loop infinito

  // Realtime subscriptions managed by useSupabaseRealtime hook (8 tables, auto-reconnect)

  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_proyectos', proyectos); }, [proyectos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_movimientos', movimientos); }, [movimientos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_empleados', empleados); }, [empleados]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_materiales', materiales); }, [materiales]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_ordenes', ordenes); }, [ordenes]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_proveedores', proveedores); }, [proveedores]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_eventos', eventos); }, [eventos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_bitacora', bitacora); }, [bitacora]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_presupuestos', presupuestos); }, [presupuestos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_selected_proyecto_id', selectedProyectoId); }, [selectedProyectoId]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_licitaciones', licitaciones); }, [licitaciones]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_avances', avances); }, [avances]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_vales_salida', valesSalida); }, [valesSalida]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_seguimiento_evm', seguimientoEVM); }, [seguimientoEVM]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_notified_eventos', notifiedEventos); }, [notifiedEventos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_cuentas_cobrar', cuentasCobrar); }, [cuentasCobrar]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_cuentas_pagar', cuentasPagar); }, [cuentasPagar]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_ordenes_cambio', ordenesCambio); }, [ordenesCambio]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_hitos', hitos); }, [hitos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_riesgos', riesgos); }, [riesgos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_incidentes', incidentes); }, [incidentes]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_publicaciones_muro', publicacionesMuro); }, [publicacionesMuro]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_pruebas', pruebas); }, [pruebas]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_no_conformidades', ncs); }, [ncs]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_liberaciones', liberaciones); }, [liberaciones]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_planos', planos); }, [planos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_rfis', rfis); }, [rfis]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_submittals', submittals); }, [submittals]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_activos', activos); }, [activos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_cuadros', cuadros); }, [cuadros]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_pagos_proveedor', pagosProveedor); }, [pagosProveedor]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_subcontratos', subcontratos); }, [subcontratos]);
  useEffect(() => { saveToStorage(QUEUE_KEY, mutationQueue); }, [mutationQueue]);

  const [syncMessage, setSyncMessage] = useState('');

  const forProyecto = (data: any) => {
    const result: any = {};
    for (const key in data) {
      const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
      result[snakeKey] = data[key];
    }
    return result;
  };

  const forMovimiento = (data: any) => {
    const result: any = {};
    for (const key in data) {
      const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
      result[snakeKey] = data[key];
    }
    result['costo_total'] = data.costoTotal ?? data.monto ?? 0;
    return result;
  };

  const forEmpleado = (data: any) => {
    const result: any = {};
    for (const key in data) {
      const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
      result[snakeKey] = data[key];
    }
    result['dias_trabajados'] = data.diasTrabajados ?? 0;
    return result;
  };

  const forMaterial = (data: any) => {
    const result: any = {};
    for (const key in data) {
      const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
      result[snakeKey] = data[key];
    }
    return result;
  };

  const forProveedor = (data: any) => toSnake(data);

  const forEvento = (data: any) => {
    const result: any = {};
    for (const key in data) {
      const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
      result[snakeKey] = data[key];
    }
    return result;
  };

  const forBitacora = (data: any) => {
    const result: any = {};
    for (const key in data) {
      const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
      result[snakeKey] = data[key];
    }
    return result;
  };

  const forLiberacion = (data: any) => {
    const result: any = {};
    for (const key in data) {
      const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
      result[snakeKey] = data[key];
    }
    return result;
  };

  const forMuro = (data: any) => {
    const result: any = {};
    for (const key in data) {
      const snakeKey = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
      result[snakeKey] = data[key];
    }
    return result;
  };

  const forNC = (data: any) => forLiberacion(data);
  const forPrueba = (data: any) => forLiberacion(data);
  const forIncidente = (data: any) => forLiberacion(data);
  const forHito = (data: any) => forLiberacion(data);
  const forRiesgo = (data: any) => forLiberacion(data);
  const forCuentaCobrar = (data: any) => forLiberacion(data);
  const forCuentaPagar = (data: any) => forLiberacion(data);
  const forOrdenCambio = (data: any) => forLiberacion(data);
  const forValeSalida = (data: any) => forLiberacion(data);

  const verificarStockCritico = useCallback(() => {
    const criticos = materiales.filter(m => m.critico && m.stock <= (m.stockMinimo ?? 0));
    if (criticos.length > 0) {
      addNotificacion('stock_critico', 'Stock crítico detectado', `${criticos.length} materiales por debajo del mínimo`, undefined, undefined, false);
    }
  }, [materiales, addNotificacion]);

  const verificarOrdenesCambioPendientes = useCallback(() => {
    const pendientes = ordenesCambio.filter(oc => oc.estado === 'pendiente');
    if (pendientes.length > 0 && user?.rol === 'Gerente') {
      addNotificacion('orden_cambio_pendiente', 'Órdenes de cambio pendientes', `${pendientes.length} órdenes esperando aprobación`, undefined, undefined, false);
    }
  }, [ordenesCambio, user, addNotificacion]);

  const verificarChecklistRechazado = useCallback((_proyectoId: string) => {
    const rechazadas = licitaciones.filter(l => l.estado === 'rechazada');
    if (rechazadas.length > 0) {
      addNotificacion('checklist_rechazado', 'Licitaciones rechazadas', `${rechazadas.length} licitaciones requieren atención`, _proyectoId, undefined, false);
    }
  }, [licitaciones, addNotificacion]);

  const notifyAvanceRegistrado = useCallback((_proyectoId: string, _renglonNombre: string, _avance: number) => {
    addNotificacion('avance_registrado', 'Avance registrado', `Progreso actualizado en renglón: ${_renglonNombre}`, _proyectoId, undefined, false);
  }, [addNotificacion]);

  const notifyDesviacionRendimiento = useCallback((_actividad: string, _eficiencia: number, _proyectoId: string) => {
    const nivel = _eficiencia < 70 ? 'Crítica' : _eficiencia < 85 ? 'Alerta' : 'Normal';
    addNotificacion('desviacion_rendimiento', `Desviación: ${nivel}`, `Actividad ${_actividad}: eficiencia ${_eficiencia}%`, _proyectoId, undefined, false);
  }, [addNotificacion]);

  const processQueue = useCallback(async () => {
    if (!isOnline || mutationQueue.length === 0) return;

    const [next, ...rest] = mutationQueue;

    try {
      // Notificar que estamos sincronizando
      setSyncMessage(`Sincronizando ${next.type}...`);
      
      switch (next.type) {
        case 'addProyecto': {
          const p = forProyecto({ ...next.payload, created_by: user?.id });
          const { error } = await supabase.from('erp_proyectos').insert(p);
          if (error) throw new Error(`Failed to add proyecto: ${error.message}`);
          break;
        }
        case 'updateProyecto': {
          const { id, ...rest2 } = next.payload;
          const { error } = await supabase.from('erp_proyectos').update(forProyecto(rest2)).eq('id', id);
          if (error) throw new Error(`Failed to update proyecto: ${error.message}`);
          break;
        }
        case 'deleteProyecto': {
          const { error } = await supabase.from('erp_proyectos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete proyecto: ${error.message}`);
          break;
        }
        case 'addMovimiento': {
          const m = forMovimiento({ ...next.payload, created_by: user?.id });
          const { error } = await supabase.from('erp_movimientos').insert(m);
          if (error) throw new Error(`Failed to add movimiento: ${error.message}`);
          break;
        }
        case 'deleteMovimiento': {
          const { error } = await supabase.from('erp_movimientos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete movimiento: ${error.message}`);
          break;
        }
                case 'addEmpleado': {
          const { error } = await supabase.from('erp_empleados').insert(forEmpleado(next.payload));
          if (error) throw new Error(`Failed to add empleado: ${error.message}`);
          break;
        }
        case 'updateEmpleado': {
          const { id, ...rest3 } = next.payload;
          const { error } = await supabase.from('erp_empleados').update(forEmpleado(rest3)).eq('id', id);
          if (error) throw new Error(`Failed to update empleado: ${error.message}`);
          break;
        }
        case 'deleteEmpleado': {
          const { error } = await supabase.from('erp_empleados').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete empleado: ${error.message}`);
          break;
        }
        case 'addMaterial': {
          const { error } = await supabase.from('erp_materiales').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add material: ${error.message}`);
          break;
        }
        case 'updateMaterial': {
          const { id, ...rest4 } = next.payload;
          const { error } = await supabase.from('erp_materiales').update(forMaterial(rest4)).eq('id', id);
          if (error) throw new Error(`Failed to update material: ${error.message}`);
          break;
        }
        case 'deleteMaterial': {
          const { error } = await supabase.from('erp_materiales').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete material: ${error.message}`);
          break;
        }
        case 'addOrden': {
          const { error } = await supabase.from('erp_ordenes_compra').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add orden: ${error.message}`);
          break;
        }
        case 'updateOrden': {
          const { error } = await supabase.from('erp_ordenes_compra').update({ estado: next.payload.estado }).eq('id', next.payload.id);
          if (error) throw new Error(`Failed to update orden: ${error.message}`);
          break;
        }
        case 'addProveedor': {
          const { error } = await supabase.from('erp_proveedores').insert(forProveedor(next.payload));
          if (error) throw new Error(`Failed to add proveedor: ${error.message}`);
          break;
        }
        case 'updateProveedor': {
          const { id, ...rest5 } = next.payload;
          const { error } = await supabase.from('erp_proveedores').update(forProveedor(rest5)).eq('id', id);
          if (error) throw new Error(`Failed to update proveedor: ${error.message}`);
          break;
        }
        case 'deleteProveedor': {
          const { error } = await supabase.from('erp_proveedores').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete proveedor: ${error.message}`);
          break;
        }
        case 'addEvento': {
          const { error } = await supabase.from('erp_eventos_calendario').insert(forEvento(next.payload));
          if (error) throw new Error(`Failed to add evento: ${error.message}`);
          break;
        }
        case 'updateEvento': {
          const { id, ...rest6 } = next.payload;
          const { error } = await supabase.from('erp_eventos_calendario').update(forEvento(rest6)).eq('id', id);
          if (error) throw new Error(`Failed to update evento: ${error.message}`);
          break;
        }
        case 'deleteEvento': {
          const { error } = await supabase.from('erp_eventos_calendario').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete evento: ${error.message}`);
          break;
        }
        case 'addBitacora': {
          const { error } = await supabase.from('erp_bitacora').insert(forBitacora(next.payload));
          if (error) throw new Error(`Failed to add bitacora: ${error.message}`);
          break;
        }
        case 'updateBitacora': {
          const { id, ...rest7 } = next.payload;
          const { error } = await supabase.from('erp_bitacora').update(forBitacora(rest7)).eq('id', id);
          if (error) throw new Error(`Failed to update bitacora: ${error.message}`);
          break;
        }
        case 'deleteBitacora': {
          const { error } = await supabase.from('erp_bitacora').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete bitacora: ${error.message}`);
          break;
        }
        case 'addPresupuesto': {
          const { error } = await supabase.from('erp_presupuestos').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add presupuesto: ${error.message}`);
          break;
        }
        case 'updatePresupuesto': {
          const { id, ...rest8 } = next.payload;
          const { error } = await supabase.from('erp_presupuestos').update(toSnake(rest8)).eq('id', id);
          if (error) throw new Error(`Failed to update presupuesto: ${error.message}`);
          break;
        }
        case 'deletePresupuesto': {
          const { error } = await supabase.from('erp_presupuestos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete presupuesto: ${error.message}`);
          break;
        }
        case 'addValeSalida': {
          const { error } = await supabase.from('erp_vales_salida').insert([toSnake(next.payload)]);
          if (error) throw new Error(`Failed to add vale salida: ${error.message}`);
          break;
        }
case 'deleteValeSalida': {
           const { error } = await supabase.from('erp_vales_salida').delete().eq('id', next.payload.id);
           if (error) throw new Error(`Failed to delete vale salida: ${error.message}`);
           break;
         }
        // Tablas en DB (usar toSnake para camelCase → snake_case)
        case 'addAvance': {
          const { error } = await supabase.from('erp_avances').insert([toSnake(next.payload)]);
          if (error) throw new Error(`Failed to add avance: ${error.message}`);
          break;
        }
        case 'deleteAvance': {
          const { error } = await supabase.from('erp_avances').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete avance: ${error.message}`);
          break;
        }
        case 'addLicitacion': {
          const { error } = await supabase.from('erp_licitaciones').insert([toSnake(next.payload)]);
          if (error) throw new Error(`Failed to add licitacion: ${error.message}`);
          break;
        }
        case 'updateLicitacion': {
          const { id, ...restL } = next.payload;
          const { error } = await supabase.from('erp_licitaciones').update(toSnake(restL)).eq('id', id);
          if (error) throw new Error(`Failed to update licitacion: ${error.message}`);
          break;
        }
        case 'deleteLicitacion': {
          const { error } = await supabase.from('erp_licitaciones').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete licitacion: ${error.message}`);
          break;
        }
        case 'addCuentaCobrar': {
          const { error } = await supabase.from('erp_cuentas_cobrar').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add cuenta cobrar: ${error.message}`);
          break;
        }
        case 'updateCuentaCobrar': {
          const { id, ...restCC } = next.payload;
          const { error } = await supabase.from('erp_cuentas_cobrar').update(toSnake(restCC)).eq('id', id);
          if (error) throw new Error(`Failed to update cuenta cobrar: ${error.message}`);
          break;
        }
        case 'deleteCuentaCobrar': {
          const { error } = await supabase.from('erp_cuentas_cobrar').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete cuenta cobrar: ${error.message}`);
          break;
        }
        case 'addCuentaPagar': {
          const { error } = await supabase.from('erp_cuentas_pagar').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add cuenta pagar: ${error.message}`);
          break;
        }
        case 'updateCuentaPagar': {
          const { id, ...restCP } = next.payload;
          const { error } = await supabase.from('erp_cuentas_pagar').update(toSnake(restCP)).eq('id', id);
          if (error) throw new Error(`Failed to update cuenta pagar: ${error.message}`);
          break;
        }
        case 'deleteCuentaPagar': {
          const { error } = await supabase.from('erp_cuentas_pagar').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete cuenta pagar: ${error.message}`);
          break;
        }
        case 'addOrdenCambio': {
          const { error } = await supabase.from('erp_ordenes_cambio').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add orden cambio: ${error.message}`);
          break;
        }
        case 'updateOrdenCambio': {
          const { id, ...restOC } = next.payload;
          const { error } = await supabase.from('erp_ordenes_cambio').update(toSnake(restOC)).eq('id', id);
          if (error) throw new Error(`Failed to update orden cambio: ${error.message}`);
          break;
        }
        case 'deleteOrdenCambio': {
          const { error } = await supabase.from('erp_ordenes_cambio').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete orden cambio: ${error.message}`);
          break;
        }
        case 'addHito': {
          const { error } = await supabase.from('erp_hitos').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add hito: ${error.message}`);
          break;
        }
        case 'updateHito': {
          const { id, ...restH } = next.payload;
          const { error } = await supabase.from('erp_hitos').update(toSnake(restH)).eq('id', id);
          if (error) throw new Error(`Failed to update hito: ${error.message}`);
          break;
        }
        case 'deleteHito': {
          const { error } = await supabase.from('erp_hitos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete hito: ${error.message}`);
          break;
        }
        case 'addRiesgo': {
          const { error } = await supabase.from('erp_riesgos').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add riesgo: ${error.message}`);
          break;
        }
        case 'updateRiesgo': {
          const { id, ...restR } = next.payload;
          const { error } = await supabase.from('erp_riesgos').update(toSnake(restR)).eq('id', id);
          if (error) throw new Error(`Failed to update riesgo: ${error.message}`);
          break;
        }
        case 'deleteRiesgo': {
          const { error } = await supabase.from('erp_riesgos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete riesgo: ${error.message}`);
          break;
        }
        case 'addActivo': {
          const { error } = await supabase.from('erp_activos').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add activo: ${error.message}`);
          break;
        }
        case 'updateActivo': {
          const { id, ...restAct } = next.payload;
          const { error } = await supabase.from('erp_activos').update(toSnake(restAct)).eq('id', id);
          if (error) throw new Error(`Failed to update activo: ${error.message}`);
          break;
        }
        case 'deleteActivo': {
          const { error } = await supabase.from('erp_activos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete activo: ${error.message}`);
          break;
        }
        case 'addCuadro': {
          const { error } = await supabase.from('erp_cuadros_comparativos').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add cuadro: ${error.message}`);
          break;
        }
        case 'updateCuadro': {
          const { id, ...restCuad } = next.payload;
          const { error } = await supabase.from('erp_cuadros_comparativos').update(toSnake(restCuad)).eq('id', id);
          if (error) throw new Error(`Failed to update cuadro: ${error.message}`);
          break;
        }
        case 'addPagoProveedor': {
          const { error } = await supabase.from('erp_pagos_proveedor').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add pago proveedor: ${error.message}`);
          break;
        }
        case 'updatePagoProveedor': {
          const { id, ...restPP } = next.payload;
          const { error } = await supabase.from('erp_pagos_proveedor').update(toSnake(restPP)).eq('id', id);
          if (error) throw new Error(`Failed to update pago proveedor: ${error.message}`);
          break;
        }
        case 'addPlano': {
          const { error } = await supabase.from('erp_planos').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add plano: ${error.message}`);
          break;
        }
        case 'updatePlano': {
          const { id, ...restPlano } = next.payload;
          const { error } = await supabase.from('erp_planos').update(toSnake(restPlano)).eq('id', id);
          if (error) throw new Error(`Failed to update plano: ${error.message}`);
          break;
        }
        case 'deletePlano': {
          const { error } = await supabase.from('erp_planos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete plano: ${error.message}`);
          break;
        }
        case 'addRfi': {
          const { error } = await supabase.from('erp_rfis').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add rfi: ${error.message}`);
          break;
        }
        case 'updateRfi': {
          const { id, ...restRfi } = next.payload;
          const { error } = await supabase.from('erp_rfis').update(toSnake(restRfi)).eq('id', id);
          if (error) throw new Error(`Failed to update rfi: ${error.message}`);
          break;
        }
        case 'deleteRfi': {
          const { error } = await supabase.from('erp_rfis').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete rfi: ${error.message}`);
          break;
        }
        case 'addSubmittal': {
          const { error } = await supabase.from('erp_submittals').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add submittal: ${error.message}`);
          break;
        }
        case 'updateSubmittal': {
          const { id, ...restSub } = next.payload;
          const { error } = await supabase.from('erp_submittals').update(toSnake(restSub)).eq('id', id);
          if (error) throw new Error(`Failed to update submittal: ${error.message}`);
          break;
        }
        case 'deleteSubmittal': {
          const { error } = await supabase.from('erp_submittals').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete submittal: ${error.message}`);
          break;
        }
        case 'addIncidente': {
          const { error } = await supabase.from('erp_incidentes').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add incidente: ${error.message}`);
          break;
        }
        case 'updateIncidente': {
          const { id, ...restInc } = next.payload;
          const { error } = await supabase.from('erp_incidentes').update(toSnake(restInc)).eq('id', id);
          if (error) throw new Error(`Failed to update incidente: ${error.message}`);
          break;
        }
        case 'deleteIncidente': {
          const { error } = await supabase.from('erp_incidentes').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete incidente: ${error.message}`);
          break;
        }
        case 'addPrueba': {
          const { error } = await supabase.from('erp_pruebas_laboratorio').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add prueba: ${error.message}`);
          break;
        }
        case 'updatePrueba': {
          const { id, ...restPrueba } = next.payload;
          const { error } = await supabase.from('erp_pruebas_laboratorio').update(toSnake(restPrueba)).eq('id', id);
          if (error) throw new Error(`Failed to update prueba: ${error.message}`);
          break;
        }
        case 'deletePrueba': {
          const { error } = await supabase.from('erp_pruebas_laboratorio').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete prueba: ${error.message}`);
          break;
        }
        case 'addNC': {
          const { error } = await supabase.from('erp_no_conformidades').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add nc: ${error.message}`);
          break;
        }
        case 'updateNC': {
          const { id, ...restNC } = next.payload;
          const { error } = await supabase.from('erp_no_conformidades').update(toSnake(restNC)).eq('id', id);
          if (error) throw new Error(`Failed to update nc: ${error.message}`);
          break;
        }
        case 'deleteNC': {
          const { error } = await supabase.from('erp_no_conformidades').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete nc: ${error.message}`);
          break;
        }
        case 'addLiberacion': {
          const { error } = await supabase.from('erp_liberaciones_partida').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add liberacion: ${error.message}`);
          break;
        }
        case 'updateLiberacion': {
          const { id, ...restLib } = next.payload;
          const { error } = await supabase.from('erp_liberaciones_partida').update(toSnake(restLib)).eq('id', id);
          if (error) throw new Error(`Failed to update liberacion: ${error.message}`);
          break;
        }
        case 'deleteLiberacion': {
          const { error } = await supabase.from('erp_liberaciones_partida').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete liberacion: ${error.message}`);
          break;
        }
        case 'addPublicacionMuro': {
          const { error } = await supabase.from('erp_muro').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add publicacion muro: ${error.message}`);
          break;
        }
        case 'addComentarioMuro': {
          const { pubId, ...comentario } = next.payload;
          const { data: existing, error: fetchErr } = await supabase.from('erp_muro').select('comentarios').eq('id', pubId).maybeSingle();
          if (fetchErr) throw fetchErr;
          const comentarios = Array.isArray(existing?.comentarios) ? existing.comentarios : [];
          const { error } = await supabase.from('erp_muro').update({ comentarios: [...comentarios, comentario] }).eq('id', pubId);
          if (error) throw new Error(`Failed to add comentario muro: ${error.message}`);
          break;
        }
        case 'likePublicacionMuro': {
          const pubId = next.payload.pubId as string;
          const { data: existing, error: fetchErr } = await supabase.from('erp_muro').select('likes').eq('id', pubId).maybeSingle();
          if (fetchErr) throw fetchErr;
          const nextLikes = (existing?.likes ?? 0) + 1;
          const { error } = await supabase.from('erp_muro').update({ likes: nextLikes }).eq('id', pubId);
          if (error) throw new Error(`Failed to like publicacion: ${error.message}`);
          break;
        }
case 'addNotificacion': {
           const { error } = await supabase.from('erp_notificaciones').insert(toSnake(next.payload));
           if (error) throw new Error(`Failed to add notificacion: ${error.message}`);
           break;
         }
         case 'addSeguimiento': {
           const { error } = await supabase.from('erp_seguimiento').insert(toSnake(next.payload));
           if (error) throw new Error(`Failed to add seguimiento: ${error.message}`);
           break;
         }
         case 'updateSeguimiento': {
           const { id, ...restSeg } = next.payload;
           const { error } = await supabase.from('erp_seguimiento').update(toSnake(restSeg)).eq('id', id);
           if (error) throw new Error(`Failed to update seguimiento: ${error.message}`);
           break;
         }
         case 'deleteSeguimiento': {
           const { error } = await supabase.from('erp_seguimiento').delete().eq('id', next.payload.id);
           if (error) throw new Error(`Failed to delete seguimiento: ${error.message}`);
           break;
         }
         case 'markNotificacionLeida': {
          const ids = (next.payload.ids as string[]) || [next.payload.id as string];
          const { error } = await supabase.from('erp_notificaciones').update({ leido: true }).in('id', ids);
          if (error) throw new Error(`Failed to update notificacion: ${error.message}`);
          break;
        }
      }
      setMutationQueue(rest);
      setSyncMessage('');
    } catch (err) {
      console.error('Error processing mutation queue:', err);
      setSyncMessage('');
      // Reintentar hasta 3 veces con backoff exponencial
      if (next.retryCount < 3) {
        const retryMutation: Mutation = { ...next, retryCount: next.retryCount + 1 };
        setMutationQueue(_q => [retryMutation, ...rest]);
      } else {
        // Notificar al usuario que la mutación se descartó
        toast.error(`No se pudo sincronizar: ${next.type}. Los cambios se mantienen localmente.`);
        console.error(`Mutation ${next.type} (${next.id}) falló tras ${next.retryCount} intentos. Descartada.`);
        setMutationQueue(rest);
      }
    }
  }, [isOnline, mutationQueue, user]);

  // Procesar cola al reconectar Y cada 30 segundos mientras online
  useEffect(() => {
    if (!isOnline) return;
    const timer = setTimeout(processQueue, 300);
    const interval = setInterval(() => {
      if (mutationQueue.length > 0) processQueue();
    }, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isOnline, processQueue, mutationQueue.length]);

  // Chequeo de stock critico y OC pendientes - SOLO al inicio, sin intervalos
  useEffect(() => {
    if (!user) return;
  }, [user]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const sendReminderNotification = useCallback((evento: EventoCalendario) => {
    const title = `Recordatorio: ${evento.titulo}`;
    const description = evento.descripcion
      ? evento.descripcion
      : evento.proyectoId
        ? `Actividad asociada al proyecto ${proyectos.find(p => p.id === evento.proyectoId)?.nombre || evento.proyectoId}`
        : 'Revisa tu calendario para más detalles.';

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: description,
        icon: '/logo.png', // Configurable: ruta del logo de la empresa
      });
    } else {
      toast(title, {
        description,
        action: {
          label: 'Ver calendario',
          onClick: () => setView('dashboard'),
        },
      });
    }
  }, [proyectos, setView]);

  useEffect(() => {
    requestNotificationPermission();

    const checkReminders = () => {
      if (typeof window === 'undefined') return;
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);

      eventos.forEach(evento => {
        if (notifiedEventos.includes(evento.id) || evento.completado) return;

        const time = evento.hora || '09:00';
        const dateTime = new Date(`${evento.fecha}T${time}:00`);
        if (Number.isNaN(dateTime.getTime())) return;

        const diff = dateTime.getTime() - now.getTime();
        const shouldNotify = evento.fecha === todayIso
          ? diff <= 5 * 60 * 1000 && diff >= -15 * 60 * 1000
          : false;

        if (shouldNotify) {
          sendReminderNotification(evento);
          setNotifiedEventos(ids => ids.includes(evento.id) ? ids : [...ids, evento.id]);
        }
      });
    };

    checkReminders();
    const timer = setInterval(checkReminders, 30 * 1000);
    return () => clearInterval(timer);
  }, [eventos, notifiedEventos, requestNotificationPermission, sendReminderNotification]);

  const signIn = async (email: string, pass: string) => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) setAuthError(error.message);
  };
  const signUp = async (email: string, pass: string, nombre: string, rol: Rol) => {
    setAuthError('');
    const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { full_name: nombre, nombre, rol } } });
    if (error) setAuthError(error.message);
  };
  const logout = async () => { await supabase.auth.signOut(); setUser(null); setView('login'); };

  const signInWithGoogle = async () => {
    setAuthError('');
    try {
      const googleHd = import.meta.env.VITE_GOOGLE_OAUTH_HD;
      const queryParams: Record<string, string> = {
        prompt: 'select_account',
      };
      if (googleHd) queryParams.hd = googleHd;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Let the Supabase client perform the redirect so the PKCE
          // code verifier is stored and the library can complete the
          // code exchange automatically on redirect.
          redirectTo: window.location.origin,
          queryParams,
        },
      });
      if (error) throw error;
      // When skipBrowserRedirect is not set, the client may perform the redirect
      // automatically; as a fallback handle the returned URL if present.
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setAuthError(err instanceof Error ? err.message : 'Error al conectar con Google');
    }
  };

  // M-05: Costo por hora/hombre
  const costoPorHoraHombre = useCallback((proyectoId?: string): { total: number; empleados: number; promedioSalario: number } => {
    const empFiltrados = proyectoId
      ? empleados.filter(e => e.proyectoIds?.includes(proyectoId))
      : empleados;
    const activos = empFiltrados.filter(e => e.activo);
    const totalSalarios = activos.reduce((sum, e) => sum + (e.salarioDiario || 0), 0);
    const horasDiarias = 8;
    return {
      total: totalSalarios,
      empleados: activos.length,
      promedioSalario: activos.length > 0 ? totalSalarios / activos.length / horasDiarias : 0,
    };
  }, [empleados]);

  // M-08: Empleados disponibles (no asignados al proyecto especificado)
  const empleadosDisponibles = useCallback((proyectoId: string): Empleado[] => {
    return empleados.filter(e => e.activo && (!e.proyectoIds?.includes(proyectoId) || e.proyectoIds.length === 0));
  }, [empleados]);

  // F-04: Cálculo automático avance financiero derivado de movimientos
  const avanceFinancieroCalculado = useCallback((proyectoId: string): number => {
    const proy = proyectos.find(p => p.id === proyectoId);
    if (!proy || !proy.montoContrato || proy.montoContrato <= 0) return 0;
    const ingresos = movimientos
      .filter(m => m.proyectoId === proyectoId && m.tipo === 'ingreso')
      .reduce((a, b) => a + (b.costoTotal ?? b.monto ?? 0), 0);
    const ejecutado = Math.min(100, Math.round((ingresos / proy.montoContrato) * 100));
    return ejecutado;
  }, [proyectos, movimientos]);

  const allowedViews = user ? ALLOWED[user.rol] : [];

  const addProyecto = async (p: Omit<Proyecto, 'id'>) => {
    const newProj = { ...p, id: uid() };
    setProyectos(s => [...s, newProj]);
    enqueueMutation('addProyecto', newProj);
  };
  const updateProyecto = useCallback(async (id: string, patch: Partial<Proyecto>) => {
    setProyectos(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateProyecto', { id, ...patch });
  }, [enqueueMutation]);
  const deleteProyecto = useCallback(async (id: string) => {
    setProyectos(s => s.filter(p => p.id !== id));
    enqueueMutation('deleteProyecto', { id });
  }, [enqueueMutation]);

  const addMovimiento = useCallback(async (m: Omit<Movimiento, 'id'>) => {
    const newMov = { ...m, id: uid() };
    setMovimientos(s => [newMov, ...s]);
    enqueueMutation('addMovimiento', newMov);
  }, [enqueueMutation]);
  const deleteMovimiento = useCallback(async (id: string) => {
    setMovimientos(s => s.filter(m => m.id !== id));
    enqueueMutation('deleteMovimiento', { id });
  }, [enqueueMutation]);
  const updateMovimiento = useCallback(async (id: string, patch: Partial<Movimiento>) => {
    setMovimientos(s => s.map(m => m.id === id ? { ...m, ...patch } : m));
    enqueueMutation('updateMovimiento', { id, ...patch });
  }, [enqueueMutation]);

  const addEmpleado = async (e: Omit<Empleado, 'id'>) => {
    const newEmp = { ...e, id: uid() };
    setEmpleados(s => [...s, newEmp]);
    enqueueMutation('addEmpleado', newEmp);
  };
  const updateEmpleado = async (id: string, patch: Partial<Empleado>) => {
    setEmpleados(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
    enqueueMutation('updateEmpleado', { id, ...patch });
  };
  const deleteEmpleado = async (id: string) => {
    setEmpleados(s => s.filter(e => e.id !== id));
    enqueueMutation('deleteEmpleado', { id });
  };

  const addPresupuesto = useCallback(async (p: Omit<Presupuesto, 'id'>) => {
    const versionesExistentes = presupuestos.filter(pr => pr.proyectoId === p.proyectoId);
    const nextVersion = versionesExistentes.length > 0
      ? Math.max(...versionesExistentes.map(pr => pr.versionPresupuesto || 1)) + 1
      : (p.versionPresupuesto ?? 1);

    const newPresupuesto: Presupuesto = {
      ...p,
      id: uid(),
      versionPresupuesto: nextVersion,
    };

    enqueueMutation('addPresupuesto', newPresupuesto);
    setPresupuestos(s => [...s, newPresupuesto]);

    if (p.proyectoId) {
      try {
        await updateProyecto(p.proyectoId, {
          presupuestoActualId: newPresupuesto.id,
          presupuestoTotal: newPresupuesto.totalCalculado,
        });
      } catch (err) {
        console.error('Error actualizando proyecto con presupuesto:', err);
      }
    }
  }, [enqueueMutation, presupuestos, updateProyecto]);

  const updatePresupuesto = useCallback(async (id: string, patch: Partial<Presupuesto>) => {
    const updated = presupuestos.map(p => p.id === id ? { ...p, ...patch, fechaActualizacion: new Date().toISOString() } : p);

    enqueueMutation('updatePresupuesto', { id, ...patch });
    setPresupuestos(updated);

    const presupuestoActualizado = updated.find(p => p.id === id);
    if (presupuestoActualizado) {
      const proyectoActual = proyectos.find(proy => proy.id === presupuestoActualizado.proyectoId);
      if (proyectoActual?.presupuestoActualId === id) {
        try {
          await updateProyecto(presupuestoActualizado.proyectoId, {
            presupuestoTotal: presupuestoActualizado.totalCalculado,
          });
        } catch (err) {
          console.error('Error actualizando proyecto tras editar presupuesto:', err);
        }
      }
    }
  }, [enqueueMutation, presupuestos, proyectos, updateProyecto]);

  const deletePresupuesto = useCallback(async (id: string) => {
    const presupuestoEliminado = presupuestos.find(p => p.id === id);
    enqueueMutation('deletePresupuesto', { id });

    const remainingPresupuestos = presupuestos.filter(p => p.id !== id);
    setPresupuestos(remainingPresupuestos);

    if (presupuestoEliminado?.proyectoId) {
      const proyectoActual = proyectos.find(proy => proy.id === presupuestoEliminado.proyectoId);
      if (proyectoActual?.presupuestoActualId === id) {
        const ultimoPresupuesto = remainingPresupuestos
          .filter(p => p.proyectoId === presupuestoEliminado.proyectoId)
          .sort((a, b) => new Date(b.fechaActualizacion).getTime() - new Date(a.fechaActualizacion).getTime())[0];

        try {
          await updateProyecto(presupuestoEliminado.proyectoId, {
            presupuestoActualId: ultimoPresupuesto?.id ?? null,
            presupuestoTotal: ultimoPresupuesto?.totalCalculado ?? 0,
          });
        } catch (err) {
          console.error('Error actualizando proyecto tras eliminar presupuesto:', err);
        }
      }
    }
  }, [enqueueMutation, presupuestos, proyectos, updateProyecto]);

  const getPresupuestoByProyecto = useCallback((proyectoId: string) => {
    return presupuestos.find(p => p.proyectoId === proyectoId);
  }, [presupuestos]);

  const addLicitacion = async (l: Omit<Licitacion, 'id'>) => {
    const newLicitacion = { ...l, id: uid() };
    setLicitaciones(s => [newLicitacion, ...s]);
    enqueueMutation('addLicitacion', newLicitacion);
  };

  const updateLicitacion = async (id: string, patch: Partial<Licitacion>) => {
    setLicitaciones(s => s.map(l => l.id === id ? { ...l, ...patch } : l));
    enqueueMutation('updateLicitacion', { id, ...patch });
  };

  const deleteLicitacion = async (id: string) => {
    setLicitaciones(s => s.filter(l => l.id !== id));
    enqueueMutation('deleteLicitacion', { id });
  };

  const updateMaterial = async (id: string, patch: Partial<Material>) => {
    setMateriales(s => s.map(m => m.id === id ? { ...m, ...patch } : m));
    enqueueMutation('updateMaterial', { id, ...patch });
  };
  const addMaterial = async (m: Omit<Material, 'id'>) => {
    const newMat = { ...m, id: uid() };
    setMateriales(s => [newMat, ...s]);
    enqueueMutation('addMaterial', newMat);
  };
  const deleteMaterial = async (id: string) => {
    setMateriales(s => s.filter(m => m.id !== id));
    enqueueMutation('deleteMaterial', { id });
  };

  const addOrden = async (o: Omit<OrdenCompra, 'id'>) => {
    const newOrd = { ...o, id: uid() };
    setOrdenes(s => [newOrd, ...s]);
    enqueueMutation('addOrden', newOrd);
  };
  const updateOrden = async (id: string, estado: OrdenCompra['estado']) => {
    setOrdenes(s => s.map(o => o.id === id ? { ...o, estado } : o));
    enqueueMutation('updateOrden', { id, estado });
    
    // P2: Descuento automático de stock cuando OC es recibida/aprobada
    if ((estado === 'aprobado' || estado === 'recibida') && Array.isArray(ordenes)) {
      const orden = ordenes.find(o => o.id === id);
      if (orden?.items && Array.isArray(orden.items)) {
        orden.items.forEach(item => {
          setMateriales(prev => prev.map(m =>
            m.id === item.materialId
              ? { ...m, stock: m.stock + item.cantidad }
              : m
          ));
        });
      }
    }
  };

  const addProveedor = async (p: Omit<Proveedor, 'id'>) => {
    const newProv = { ...p, id: uid() };
    setProveedores(s => [...s, newProv]);
    enqueueMutation('addProveedor', newProv);
  };
  const updateProveedor = async (id: string, patch: Partial<Proveedor>) => {
    setProveedores(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateProveedor', { id, ...patch });
  };
  const deleteProveedor = async (id: string) => {
    setProveedores(s => s.filter(p => p.id !== id));
    enqueueMutation('deleteProveedor', { id });
  };

  const addEvento = async (e: Omit<EventoCalendario, 'id'>) => {
    const newEvt = { ...e, id: uid() };
    setEventos(s => [...s, newEvt]);
    enqueueMutation('addEvento', newEvt);
  };
  const updateEvento = async (id: string, patch: Partial<EventoCalendario>) => {
    setEventos(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
    enqueueMutation('updateEvento', { id, ...patch });
  };
  const deleteEvento = async (id: string) => {
    setEventos(s => s.filter(e => e.id !== id));
    enqueueMutation('deleteEvento', { id });
  };

  const addBitacora = async (b: Omit<BitacoraEntry, 'id'>) => {
    const newBit = { ...b, id: uid() };
    setBitacora(s => [newBit, ...s]);
    enqueueMutation('addBitacora', newBit);
  };

  const updateBitacora = async (id: string, patch: Partial<BitacoraEntry>) => {
    setBitacora(s => s.map(b => b.id === id ? { ...b, ...patch } : b));
    enqueueMutation('updateBitacora', { id, ...patch });
  };

  const deleteBitacora = async (id: string) => {
    setBitacora(s => s.filter(b => b.id !== id));
    enqueueMutation('deleteBitacora', { id });
  };

  const avancesRef = useRef(avances);
  avancesRef.current = avances;

  const addAvance = async (a: Omit<AvanceObra, 'id'>) => {
    const newAvance: AvanceObra = { ...a, id: uid() };
    const avancesActualizados = [newAvance, ...avancesRef.current];
    setAvances(avancesActualizados);
    enqueueMutation('addAvance', newAvance);

    // Cascade avance to presupuesto renglon + compute weighted project avance
    let weightedAvance = 0;
    if (a.presupuestoId && a.renglonId) {
      setPresupuestos(s => s.map(p => {
        if (p.id !== a.presupuestoId) return p;
        const updatedRenglones = p.renglones.map(r => {
          if (r.id !== a.renglonId) return r;
          return { ...r, avanceFisico: a.avanceFisico, avanceFinanciero: a.avanceFisico };
        });
        const totalCost = updatedRenglones.reduce((sum, r) =>
          sum + r.costoMateriales + r.costoManoObra + r.costoEquipo, 0);
        weightedAvance = totalCost > 0
          ? updatedRenglones.reduce((sum, r) =>
              sum + ((r.avanceFisico ?? 0) * (r.costoMateriales + r.costoManoObra + r.costoEquipo) / totalCost), 0)
          : 0;
        return { ...p, renglones: updatedRenglones };
      }));
    } else {
      const todosAvances = avancesActualizados.filter(av => av.proyectoId === a.proyectoId);
      weightedAvance = todosAvances.length > 0
        ? todosAvances.reduce((sum, av) => sum + av.avanceFisico, 0) / todosAvances.length
        : 0;
    }

    await updateProyecto(a.proyectoId, { avanceFisico: Math.round(weightedAvance) });
  };

  const deleteAvance = async (id: string) => {
    setAvances(s => s.filter(a => a.id !== id));
    enqueueMutation('deleteAvance', { id });
  };

  const addValeSalida = async (v: Omit<ValeSalida, 'id'>) => {
    // P1: Validar stock >= cantidad para cada item
    for (const item of v.items) {
      const mat = materiales.find(m => m.id === item.materialId);
      if (!mat || mat.stock < item.cantidad) {
        const materialName = mat?.nombre || 'Material desconocido';
        throw new Error(
          `Stock insuficiente: ${materialName} (disponible: ${mat?.stock ?? 0}, requerido: ${item.cantidad})`
        );
      }
    }
    const newVale = { ...v, id: uid() };
    setValesSalida(s => [newVale, ...s]);
    // Descontar stock de cada material
    newVale.items.forEach(item => {
      const mat = materiales.find(m => m.id === item.materialId);
      if (mat) {
        const nuevoStock = Math.max(0, mat.stock - item.cantidad);
        setMateriales(prev => prev.map(m => m.id === item.materialId ? { ...m, stock: nuevoStock } : m));
      }
    });
    enqueueMutation('addValeSalida', newVale);
  };

  const deleteValeSalida = async (id: string) => {
    setValesSalida(s => s.filter(v => v.id !== id));
    enqueueMutation('deleteValeSalida', { id });
  };

  const addCuentaCobrar = async (c: Omit<CuentaCobrar, 'id'>) => {
    const nuevo = { ...c, id: uid() };
    setCuentasCobrar(s => [nuevo, ...s]);
    enqueueMutation('addCuentaCobrar', nuevo);
  };
  const updateCuentaCobrar = async (id: string, patch: Partial<CuentaCobrar>) => {
    setCuentasCobrar(s => s.map(c => c.id === id ? { ...c, ...patch } : c));
    enqueueMutation('updateCuentaCobrar', { id, ...patch });
  };
  const deleteCuentaCobrar = async (id: string) => {
    setCuentasCobrar(s => s.filter(c => c.id !== id));
    enqueueMutation('deleteCuentaCobrar', { id });
  };

  const addCuentaPagar = async (c: Omit<CuentaPagar, 'id'>) => {
    const nuevo = { ...c, id: uid() };
    setCuentasPagar(s => [nuevo, ...s]);
    enqueueMutation('addCuentaPagar', nuevo);
  };
  const updateCuentaPagar = async (id: string, patch: Partial<CuentaPagar>) => {
    setCuentasPagar(s => s.map(c => c.id === id ? { ...c, ...patch } : c));
    enqueueMutation('updateCuentaPagar', { id, ...patch });
  };
  const deleteCuentaPagar = async (id: string) => {
    setCuentasPagar(s => s.filter(c => c.id !== id));
    enqueueMutation('deleteCuentaPagar', { id });
  };

  const addOrdenCambio = async (o: Omit<OrdenCambio, 'id'>) => {
    const nuevo = { ...o, id: uid() };
    setOrdenesCambio(s => [nuevo, ...s]);
    enqueueMutation('addOrdenCambio', nuevo);
  };
  const updateOrdenCambio = async (id: string, patch: Partial<OrdenCambio>) => {
    setOrdenesCambio(s => s.map(o => o.id === id ? { ...o, ...patch } : o));
    enqueueMutation('updateOrdenCambio', { id, ...patch });
  };
  const deleteOrdenCambio = async (id: string) => {
    setOrdenesCambio(s => s.filter(o => o.id !== id));
    enqueueMutation('deleteOrdenCambio', { id });
  };

  const addHito = async (h: Omit<Hito, 'id'>) => {
    const nuevo = { ...h, id: uid() };
    setHitos(s => [nuevo, ...s]);
    enqueueMutation('addHito', nuevo);
  };
  const updateHito = async (id: string, patch: Partial<Hito>) => {
    setHitos(s => s.map(h => h.id === id ? { ...h, ...patch } : h));
    enqueueMutation('updateHito', { id, ...patch });
  };
  const deleteHito = async (id: string) => {
    setHitos(s => s.filter(h => h.id !== id));
    enqueueMutation('deleteHito', { id });
  };

  const addRiesgo = async (r: Omit<Riesgo, 'id'>) => {
    const nuevo = { ...r, id: uid() };
    setRiesgos(s => [nuevo, ...s]);
    enqueueMutation('addRiesgo', nuevo);
  };
  const updateRiesgo = async (id: string, patch: Partial<Riesgo>) => {
    setRiesgos(s => s.map(r => r.id === id ? { ...r, ...patch } : r));
    enqueueMutation('updateRiesgo', { id, ...patch });
  };
  const deleteRiesgo = async (id: string) => {
    setRiesgos(s => s.filter(r => r.id !== id));
    enqueueMutation('deleteRiesgo', { id });
  };

  const addActivo = async (a: Omit<ActivoHerramienta, 'id'>) => {
    const nuevo = { ...a, id: uid() };
    setActivos(s => [nuevo, ...s]);
    enqueueMutation('addActivo', nuevo);
  };
  const updateActivo = async (id: string, patch: Partial<ActivoHerramienta>) => {
    setActivos(s => s.map(a => a.id === id ? { ...a, ...patch } : a));
    enqueueMutation('updateActivo', { id, ...patch });
  };
  const deleteActivo = async (id: string) => {
    setActivos(s => s.filter(a => a.id !== id));
    enqueueMutation('deleteActivo', { id });
  };

  const addCuadro = async (c: Omit<CuadroComparativo, 'id'>) => {
    const nuevo = { ...c, id: uid() };
    setCuadros(s => [nuevo, ...s]);
    enqueueMutation('addCuadro', nuevo);
  };
  const updateCuadro = async (id: string, patch: Partial<CuadroComparativo>) => {
    setCuadros(s => s.map(c => c.id === id ? { ...c, ...patch } : c));
    enqueueMutation('updateCuadro', { id, ...patch });
  };

  const addPagoProveedor = async (p: Omit<PagoProveedor, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setPagosProveedor(s => [nuevo, ...s]);
    enqueueMutation('addPagoProveedor', nuevo);
  };
  const updatePagoProveedor = async (id: string, patch: Partial<PagoProveedor>) => {
    setPagosProveedor(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updatePagoProveedor', { id, ...patch });
  };

  const addPlano = async (p: Omit<Plano, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setPlanos(s => [nuevo, ...s]);
    enqueueMutation('addPlano', nuevo);
  };
  const updatePlano = async (id: string, patch: Partial<Plano>) => {
    setPlanos(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updatePlano', { id, ...patch });
  };
  const deletePlano = async (id: string) => {
    setPlanos(s => s.filter(p => p.id !== id));
    enqueueMutation('deletePlano', { id });
  };

  const addRfi = async (r: Omit<RFI, 'id'>) => {
    const nuevo = { ...r, id: uid() };
    setRfis(s => [nuevo, ...s]);
    enqueueMutation('addRfi', nuevo);
  };
  const updateRfi = async (id: string, patch: Partial<RFI>) => {
    setRfis(s => s.map(r => r.id === id ? { ...r, ...patch } : r));
    enqueueMutation('updateRfi', { id, ...patch });
  };
  const deleteRfi = async (id: string) => {
    setRfis(s => s.filter(r => r.id !== id));
    enqueueMutation('deleteRfi', { id });
  };

  const addSubmittal = async (s: Omit<Submittal, 'id'>) => {
    const nuevo = { ...s, id: uid() };
    setSubmittals(prev => [nuevo, ...prev]);
    enqueueMutation('addSubmittal', nuevo);
  };
  const updateSubmittal = async (id: string, patch: Partial<Submittal>) => {
    setSubmittals(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    enqueueMutation('updateSubmittal', { id, ...patch });
  };
  const deleteSubmittal = async (id: string) => {
    setSubmittals(prev => prev.filter(s => s.id !== id));
    enqueueMutation('deleteSubmittal', { id });
  };

  const addIncidente = async (i: Omit<Incidente, 'id'>) => {
    const nuevo = { ...i, id: uid() };
    setIncidentes(s => [nuevo, ...s]);
    enqueueMutation('addIncidente', nuevo);
  };
  const updateIncidente = async (id: string, patch: Partial<Incidente>) => {
    setIncidentes(s => s.map((i: Incidente) => i.id === id ? { ...i, ...patch } : i));
    enqueueMutation('updateIncidente', { id, ...patch });
  };
  const deleteIncidente = async (id: string) => {
    setIncidentes(s => s.filter((i: Incidente) => i.id !== id));
    enqueueMutation('deleteIncidente', { id });
  };

  const addPrueba = async (p: Omit<PruebaLaboratorio, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setPruebas(s => [nuevo, ...s]);
    enqueueMutation('addPrueba', nuevo);
  };
  const updatePrueba = async (id: string, patch: Partial<PruebaLaboratorio>) => {
    setPruebas(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updatePrueba', { id, ...patch });
  };
  const deletePrueba = async (id: string) => {
    setPruebas(s => s.filter(p => p.id !== id));
    enqueueMutation('deletePrueba', { id });
  };

  const addNC = async (n: Omit<NoConformidad, 'id'>) => {
    const nuevo = { ...n, id: uid() };
    setNcs(s => [nuevo, ...s]);
    enqueueMutation('addNC', nuevo);
  };
  const updateNC = async (id: string, patch: Partial<NoConformidad>) => {
    setNcs(s => s.map(n => n.id === id ? { ...n, ...patch } : n));
    enqueueMutation('updateNC', { id, ...patch });
  };
  const deleteNC = async (id: string) => {
    setNcs(s => s.filter(n => n.id !== id));
    enqueueMutation('deleteNC', { id });
  };

  const addLiberacion = async (l: Omit<LiberacionPartida, 'id'>) => {
    const nuevo = { ...l, id: uid() };
    setLiberaciones(s => [nuevo, ...s]);
    enqueueMutation('addLiberacion', nuevo);
  };
  const updateLiberacion = async (id: string, patch: Partial<LiberacionPartida>) => {
    setLiberaciones(s => s.map(l => l.id === id ? { ...l, ...patch } : l));
    enqueueMutation('updateLiberacion', { id, ...patch });
  };
  const deleteLiberacion = async (id: string) => {
    setLiberaciones(s => s.filter(l => l.id !== id));
    enqueueMutation('deleteLiberacion', { id });
  };

  const addPublicacionMuro = async (p: Omit<PublicacionMuro, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setPublicacionesMuro(s => [nuevo, ...s]);
    enqueueMutation('addPublicacionMuro', nuevo);
  };
  const addComentarioMuro = async (pubId: string, c: Omit<ComentarioMuro, 'id'>) => {
    setPublicacionesMuro(s => s.map(p => p.id === pubId
      ? { ...p, comentarios: [...p.comentarios, { ...c, id: uid() }] }
      : p
    ));
    enqueueMutation('addComentarioMuro', { pubId, ...c });
  };
  const likePublicacionMuro = async (pubId: string) => {
    setPublicacionesMuro(s => s.map(p => p.id === pubId ? { ...p, likes: p.likes + 1 } : p));
    enqueueMutation('likePublicacionMuro', { pubId });
  };

  const DEFAULT_SETTINGS: AppSettings = {
    uiMode: 'shadcn',
    appTheme: 'light',
    primaryColor: '#E8752F',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    currency: 'GTQ',
    sidebarCollapsed: false,
    animationsEnabled: true,
    compactMode: false,
    fontSize: 'medium',
  };

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const stored = loadFromStorage(BASE_STORAGE_KEY + '_settings', null);
    return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
  });

  const updateAppSettings = useCallback((patch: Partial<AppSettings>) => {
    setAppSettings(prev => {
      const next = { ...prev, ...patch };
      saveToStorage(BASE_STORAGE_KEY + '_settings', next);
      if (patch.uiMode) localStorage.setItem('wm_ui_mode', patch.uiMode);
      // Sincronizar theme-mode para App.tsx/AntdProvider
      if (patch.appTheme) {
        const isDark = patch.appTheme === 'dark' || (patch.appTheme as string) === 'dark-pro';
        localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
      }
      // Aplicar tema al DOM inmediatamente (síncrono)
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        const THEME_MAP: Record<string, string> = {
          'ant-design': 'ant-design', 'dark-pro': 'dark-pro', 'material3': 'material3',
          'glassmorphism': 'glassmorphism', 'neomorphism': 'neomorphism',
          'light': 'ant-design', 'dark': 'dark-pro', 'high-contrast': 'material3',
        };
        root.setAttribute('data-theme', THEME_MAP[next.appTheme] || 'ant-design');
        if (next.primaryColor) root.style.setProperty('--primary', next.primaryColor);
        root.classList.toggle('dark', next.appTheme === 'dark' || next.appTheme === 'dark-pro');
        root.classList.toggle('compact-mode', next.compactMode === true);
        localStorage.setItem('wm_erp_theme', THEME_MAP[next.appTheme] || 'ant-design');
      }
      return next;
    });
  }, []);

  // ── Nuevas tablas: erp_renglones, erp_insumos, erp_sub_renglones ──
  const [_renglones, setRenglones] = useState(() => loadFromStorage(BASE_STORAGE_KEY + '_renglones', []));
  const [_insumos, setInsumos] = useState(() => loadFromStorage(BASE_STORAGE_KEY + '_insumos', []));
  const [_subRenglones, setSubRenglones] = useState(() => loadFromStorage(BASE_STORAGE_KEY + '_sub_renglones', []));

  // ── Supabase Realtime subscriptions (v2 API) ──
  useEffect(() => {
    const handleRenglones = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setRenglones((prev: any[]) => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setRenglones((prev: any[]) => prev.map((r: any) => r.id === payload.new.id ? payload.new : r));
      } else if (payload.eventType === 'DELETE') {
        setRenglones((prev: any[]) => prev.filter((r: any) => r.id !== payload.old.id));
      }
    };
    const handleInsumos = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setInsumos((prev: any[]) => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setInsumos((prev: any[]) => prev.map((i: any) => i.id === payload.new.id ? payload.new : i));
      } else if (payload.eventType === 'DELETE') {
        setInsumos((prev: any[]) => prev.filter((i: any) => i.id !== payload.old.id));
      }
    };
    const handleSubRenglones = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setSubRenglones((prev: any[]) => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setSubRenglones((prev: any[]) => prev.map((s: any) => s.id === payload.new.id ? payload.new : s));
      } else if (payload.eventType === 'DELETE') {
        setSubRenglones((prev: any[]) => prev.filter((s: any) => s.id !== payload.old.id));
      }
    };

    const channel = supabase.channel('erp-realtime-changes');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'erp_renglones' }, handleRenglones)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'erp_insumos' }, handleInsumos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'erp_sub_renglones' }, handleSubRenglones)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Supabase Realtime subscriptions (F-10) ──
  // DISABLED: Using Redux store now - realtime handled separately
  // const realtimeActions = useMemo(() => ({
  //   addProyecto, updateProyecto, deleteProyecto,
  //   addMovimiento, updateMovimiento, deleteMovimiento,
  //   addPresupuesto, updatePresupuesto, deletePresupuesto,
  //   setOnline: setIsOnline,
  // }), [addProyecto, updateProyecto, deleteProyecto, addMovimiento, updateMovimiento, deleteMovimiento, addPresupuesto, updatePresupuesto, deletePresupuesto, setIsOnline]);

  // useSupabaseRealtime(realtimeActions);

  const forceSync = useCallback(async () => {
    if (!isOnline) {
      setSyncMessage('Sin conexión');
      setTimeout(() => setSyncMessage(''), 3000);
      return;
    }
    if (mutationQueue.length === 0) {
      setSyncMessage('Todo sincronizado ✅');
      setTimeout(() => setSyncMessage(''), 3000);
      return;
    }
    setSyncMessage('Sincronizando...');
    await processQueue();
    const remaining = mutationQueue.length - 1;
    if (remaining <= 0) {
      setSyncMessage('Sincronizado ✅');
    } else {
      setSyncMessage(`${remaining} pendientes`);
    }
    setTimeout(() => setSyncMessage(''), 3000);
  }, [isOnline, mutationQueue, processQueue]);

  return (
    <Ctx.Provider value={{
      view, setView, user, initializing, allowedViews, authError, signIn, signUp, signInWithGoogle, logout,
      isOnline,
      proyectos, addProyecto, updateProyecto, deleteProyecto,
      movimientos, addMovimiento, updateMovimiento, deleteMovimiento,
      empleados, addEmpleado, updateEmpleado, deleteEmpleado,
      materiales, addMaterial, updateMaterial, deleteMaterial,
      ordenes, updateOrden, addOrden,
      proveedores, addProveedor, updateProveedor, deleteProveedor,
      eventos, addEvento, updateEvento, deleteEvento,
      bitacora, addBitacora, updateBitacora, deleteBitacora,
      presupuestos, addPresupuesto, updatePresupuesto, deletePresupuesto, getPresupuestoByProyecto,
      selectedProyectoId, setSelectedProyectoId,
      licitaciones, addLicitacion, updateLicitacion, deleteLicitacion,
      avances, addAvance, deleteAvance,
      valesSalida, addValeSalida, deleteValeSalida,
      cuentasCobrar, addCuentaCobrar, updateCuentaCobrar, deleteCuentaCobrar,
      cuentasPagar, addCuentaPagar, updateCuentaPagar, deleteCuentaPagar,
      ordenesCambio, addOrdenCambio, updateOrdenCambio, deleteOrdenCambio,
      hitos, addHito, updateHito, deleteHito,
      riesgos, addRiesgo, updateRiesgo, deleteRiesgo,
      incidentes, addIncidente, updateIncidente,
      publicacionesMuro, addPublicacionMuro, addComentarioMuro, likePublicacionMuro,
      pruebas, addPrueba, updatePrueba,
      ncs, addNC, updateNC,
      liberaciones, addLiberacion, updateLiberacion,
      planos, addPlano, updatePlano,
      rfis, addRfi, updateRfi,
      submittals, addSubmittal, updateSubmittal,
      activos, addActivo, updateActivo, deleteActivo,
      cuadros, addCuadro, updateCuadro,
      pagosProveedor, addPagoProveedor, updatePagoProveedor,
      seguimientoEVM, addSeguimiento: async (s: Omit<SeguimientoEVM, 'id'>) => { const nuevo = { ...s, id: uid() }; setSeguimientoEVM(p => [nuevo, ...p]); enqueueMutation('addSeguimiento', nuevo); },
      updateSeguimiento: async (id: string, patch: Partial<SeguimientoEVM>) => { setSeguimientoEVM(p => p.map(s => s.id === id ? { ...s, ...patch } : s)); enqueueMutation('updateSeguimiento', { id, ...patch }); },
      deleteSeguimiento: async (id: string) => { setSeguimientoEVM(p => p.filter(s => s.id !== id)); enqueueMutation('deleteSeguimiento', { id }); },
      avanceFinancieroCalculado,
      notificaciones, notificacionesNoLeidas, addNotificacion, markNotificacionLeida, marcarTodasLeidas,
      mutationQueue, syncMessage, forceSync,
      appSettings, updateAppSettings,
      enqueueMutation,
      verificarStockCritico, verificarOrdenesCambioPendientes, verificarChecklistRechazado, notifyAvanceRegistrado, notifyDesviacionRendimiento,
    }}>
      {children}
    </Ctx.Provider>
  );
};


