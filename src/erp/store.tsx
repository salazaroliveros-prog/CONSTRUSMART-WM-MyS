import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
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
}));

import { safeLogger } from '@/lib/safeLogger';
import { scheduleHealthCheck } from '@/lib/store-health';

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

function loadAndValidateFromStorage<T>(key: string, schema: z.ZodTypeAny, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    const result = z.array(schema).safeParse(parsed);
    if (result.success) return result.data as unknown as T;
    safeLogger.warn(`[Storage] Validación fallida para ${key}, usando valores por defecto`);
    return initial;
  } catch {
    safeLogger.warn(`[Storage] Datos corruptos en localStorage para key: ${key}. Usando valores por defecto.`);
    return initial;
  }
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

export type View = 'login' | 'dashboard' | 'proyectos' | 'presupuestos' | 'seguimiento' | 'financiero' | 'rrhh' | 'bodega' | 'crm' | 'apu' | 'curvas' | 'baseprecios' | 'reportes' | 'muro' | 'ordenes-cambio' | 'notificaciones' | 'sso-calidad' | 'documentos' | 'visor-bim' | 'predictivo' | 'exportacion' | 'logistica' | 'rendimiento-campo' | 'comercial-fin' | 'admin-sistema' | 'planilla-destajos' | 'impuestos' | 'entradas-almacen' | 'ajustes' | 'hitos' | 'riesgos' | 'cuentas-cobrar' | 'cuentas-pagar' | 'cotizaciones';

 
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
  Administrador: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega', 'crm', 'apu', 'curvas', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'visor-bim', 'predictivo', 'exportacion', 'logistica', 'rendimiento-campo', 'comercial-fin', 'admin-sistema', 'planilla-destajos', 'impuestos', 'entradas-almacen', 'ajustes', 'hitos', 'riesgos', 'cuentas-cobrar', 'cuentas-pagar', 'cotizaciones'],
  Gerente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega', 'crm', 'apu', 'curvas', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'visor-bim', 'predictivo', 'exportacion', 'logistica', 'rendimiento-campo', 'comercial-fin', 'admin-sistema', 'planilla-destajos', 'impuestos', 'entradas-almacen', 'ajustes', 'hitos', 'riesgos', 'cuentas-cobrar', 'cuentas-pagar', 'cotizaciones'],
  Residente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'apu', 'curvas', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'hitos', 'riesgos', 'ajustes', 'cotizaciones'],
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
  'addCotizacion' | 'updateCotizacion' | 'deleteCotizacion' |
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
   'addNotificacion' | 'markNotificacionLeida' | 'deleteLicitacion' |
   'deleteNC';
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


const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'salazaroliveros@gmail.com';

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

  // Listeners online/offline para disparar forceSync automáticamente al reconectar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => { setIsOnline(true); };
    const goOffline = () => { setIsOnline(false); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Integración useAuth — implementación real de signIn/signUp/logout
  const auth = useAuth();
  const user = auth.user as ErpState['user'] | null;
  const authError = auth.error;

  useEffect(() => {
    if (auth.user) {
      setAuthState({ user: auth.user as ErpState['user'], error: '' });
      // Si hay usuario autenticado, ir al dashboard
      if (view === 'login') {
        setView('dashboard');
      }
    } else {
      setAuthState({ user: null, error: auth.error });
    }
    // Cuando la primera sesión se resuelve, terminar de inicializar
    if (initializing) {
      setInitializing(false);
      // Permitir toasts después de la primera carga
      setTimeout(() => { readyRef.current = true; }, 1000);
    }
  }, [auth.user, auth.error, initializing, view]);

  // Health check automático del store
  useEffect(() => {
    const cancelHealthCheck = scheduleHealthCheck(
      () => ({
        proyectos: proyectos.length,
        movimientos: movimientos.length,
        empleados: empleados.length,
        materiales: materiales.length,
        ordenes: ordenes.length,
        presupuestos: presupuestos.length,
        licitaciones: licitaciones.length,
        cotizacionesNegocio: cotizacionesNegocio.length,
        mutationQueue: mutationQueue.length,
        notificaciones: notificaciones.length,
        isOnline,
        user: !!user,
      }),
      'ErpProvider',
      600000
    );
    return cancelHealthCheck;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch initial data from Supabase on first auth
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (user && !fetchedRef.current && hasSupabase) {
      fetchedRef.current = true;
      const fetchTable = async (tableName: string) => {
        try {
          const { data, error } = await supabase.from(tableName).select('*');
          if (!error && data) return data as Record<string, unknown>[];
        } catch {
          // Silencioso — la app funciona offline
        }
        return null;
      };
      (async () => {
        const [
          pData, mData, eData, matData, oData, provData, presData,
          ccData, cpData, ocData, hData, rData, licData, cotData,
        ] = await Promise.all([
          fetchTable('erp_proyectos'),
          fetchTable('erp_movimientos'),
          fetchTable('erp_empleados'),
          fetchTable('erp_materiales'),
          fetchTable('erp_ordenes_compra'),
          fetchTable('erp_proveedores'),
          fetchTable('erp_presupuestos'),
          fetchTable('erp_cuentas_cobrar'),
          fetchTable('erp_cuentas_pagar'),
          fetchTable('erp_ordenes_cambio'),
          fetchTable('erp_hitos'),
          fetchTable('erp_riesgos'),
          fetchTable('erp_licitaciones'),
          fetchTable('erp_cotizaciones_negocio'),
        ]);
        if (pData) setProyectos(pData as Proyecto[]);
        if (mData) setMovimientos(mData as Movimiento[]);
        if (eData) setEmpleados(eData as Empleado[]);
        if (matData) setMateriales(matData as Material[]);
        if (oData) setOrdenes(oData as OrdenCompra[]);
        if (provData) setProveedores(provData as Proveedor[]);
        if (presData) setPresupuestos(presData as Presupuesto[]);
        if (ccData) setCuentasCobrar(ccData as CuentaCobrar[]);
        if (cpData) setCuentasPagar(cpData as CuentaPagar[]);
        if (ocData) setOrdenesCambio(ocData as OrdenCambio[]);
        if (hData) setHitos(hData as Hito[]);
        if (rData) setRiesgos(rData as Riesgo[]);
        if (licData) setLicitaciones(licData as Licitacion[]);
        if (cotData) setCotizacionesNegocio(cotData as CotizacionCliente[]);
      })();
    }
  }, [user]);

  const [proyectos, setProyectos] = useState<Proyecto[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_proyectos', proyectoSchema, []));
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_movimientos', movimientoSchema, []));
  const [empleados, setEmpleados] = useState<Empleado[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_empleados', empleadoSchema, []));
  const [materiales, setMateriales] = useState<Material[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_materiales', materialSchema, []));
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_ordenes', ordenSchema, []));
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_proveedores', proveedorSchema, []));
  const [eventos, setEventos] = useState<EventoCalendario[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_eventos', []));
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_bitacora', []));
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_presupuestos', presupuestoSchema, []));
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(() => loadFromStorage(BASE_STORAGE_KEY + '_selected_proyecto_id', null));
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_licitaciones', licitacionSchema, []));
  const [avances, setAvances] = useState<AvanceObra[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_avances', []));
  const [valesSalida, setValesSalida] = useState<ValeSalida[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_vales_salida', []));
  const [seguimientoEVM, setSeguimientoEVM] = useState<SeguimientoEVM[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_seguimiento_evm', []));
  const [notifiedEventos, setNotifiedEventos] = useState<string[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_notified_eventos', []));
  const [cuentasCobrar, setCuentasCobrar] = useState<CuentaCobrar[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_cuentas_cobrar', cuentaCobrarSchema, []));
  const [cuentasPagar, setCuentasPagar] = useState<CuentaPagar[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_cuentas_pagar', cuentaPagarSchema, []));
  const [ordenesCambio, setOrdenesCambio] = useState<OrdenCambio[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_ordenes_cambio', ordenCambioSchema, []));
  const [hitos, setHitos] = useState<Hito[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_hitos', hitoSchema, []));
  const [riesgos, setRiesgos] = useState<Riesgo[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_riesgos', riesgoSchema, []));
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
  const [cotizacionesNegocio, setCotizacionesNegocio] = useState<CotizacionCliente[]>(() => loadAndValidateFromStorage(BASE_STORAGE_KEY + '_cotizacionesNegocio', cotizacionSchema, []));

  const [mutationQueue, setMutationQueue] = useState<Mutation[]>(() => loadFromStorage(QUEUE_KEY, []));
  const [syncMessage, setSyncMessage] = useState('');

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() => loadFromStorage(NOTIF_KEY, []));
  const [syncCooldown, setSyncCooldown] = useState(false);

  // appSettings: estado de configuración del usuario
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadFromStorage(BASE_STORAGE_KEY + '_settings', {
    uiMode: 'antd',
    appTheme: 'ant-design',
    primaryColor: '#ff8c42',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    currency: 'GTQ',
    sidebarCollapsed: false,
    animationsEnabled: true,
    compactMode: false,
    fontSize: 'medium',
  }));

  const updateAppSettings = useCallback((patch: Partial<AppSettings>) => {
    setAppSettings(prev => {
      const next = { ...prev, ...patch };
      saveToStorage(BASE_STORAGE_KEY + '_settings', next);
      return next;
    });
  }, []);

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
        setSyncMessage(`Sincronizando: ${mutation.type} (${successCount + 1}/${queue.length})`);

        // Construir nombre de la tabla Supabase desde el tipo de mutación
        const tableMap: Record<string, string> = {
          addProyecto: 'erp_proyectos', updateProyecto: 'erp_proyectos', deleteProyecto: 'erp_proyectos',
          addMovimiento: 'erp_movimientos', updateMovimiento: 'erp_movimientos', deleteMovimiento: 'erp_movimientos',
          addEmpleado: 'erp_empleados', updateEmpleado: 'erp_empleados', deleteEmpleado: 'erp_empleados',
          addMaterial: 'erp_materiales', updateMaterial: 'erp_materiales', deleteMaterial: 'erp_materiales',
          addOrden: 'erp_ordenes_compra', updateOrden: 'erp_ordenes_compra',
          addProveedor: 'erp_proveedores', updateProveedor: 'erp_proveedores', deleteProveedor: 'erp_proveedores',
          addEvento: 'erp_eventos_calendario', updateEvento: 'erp_eventos_calendario', deleteEvento: 'erp_eventos_calendario',
          addBitacora: 'erp_bitacora', updateBitacora: 'erp_bitacora', deleteBitacora: 'erp_bitacora',
          addPresupuesto: 'erp_presupuestos', updatePresupuesto: 'erp_presupuestos', deletePresupuesto: 'erp_presupuestos',
          addAvance: 'erp_avances', deleteAvance: 'erp_avances',
          addValeSalida: 'erp_vales_salida', deleteValeSalida: 'erp_vales_salida',
          addCuentaCobrar: 'erp_cuentas_cobrar', updateCuentaCobrar: 'erp_cuentas_cobrar', deleteCuentaCobrar: 'erp_cuentas_cobrar',
          addCuentaPagar: 'erp_cuentas_pagar', updateCuentaPagar: 'erp_cuentas_pagar', deleteCuentaPagar: 'erp_cuentas_pagar',
          addOrdenCambio: 'erp_ordenes_cambio', updateOrdenCambio: 'erp_ordenes_cambio', deleteOrdenCambio: 'erp_ordenes_cambio',
          addHito: 'erp_hitos', updateHito: 'erp_hitos', deleteHito: 'erp_hitos',
          addRiesgo: 'erp_riesgos', updateRiesgo: 'erp_riesgos', deleteRiesgo: 'erp_riesgos',
          addNC: 'erp_no_conformidades', updateNC: 'erp_no_conformidades',
          addLiberacion: 'erp_liberaciones_partidas', updateLiberacion: 'erp_liberaciones_partidas',
          addPlano: 'erp_planos', updatePlano: 'erp_planos',
          addRfi: 'erp_rfis', updateRfi: 'erp_rfis',
          addSubmittal: 'erp_submittals', updateSubmittal: 'erp_submittals',
          addActivo: 'erp_activos_herramienta', updateActivo: 'erp_activos_herramienta',
          addCuadro: 'erp_cuadros_comparativos', updateCuadro: 'erp_cuadros_comparativos',
          addPagoProveedor: 'erp_pagos_proveedores', updatePagoProveedor: 'erp_pagos_proveedores',
           addLicitacion: 'erp_licitaciones', updateLicitacion: 'erp_licitaciones', deleteLicitacion: 'erp_licitaciones',
           addCotizacion: 'erp_cotizaciones_negocio', updateCotizacion: 'erp_cotizaciones_negocio', deleteCotizacion: 'erp_cotizaciones_negocio',
           addNotificacion: 'erp_notificaciones', markNotificacionLeida: 'erp_notificaciones',
        };

        const table = tableMap[mutation.type];
        const isDelete = mutation.type.startsWith('delete');
        const isUpdate = mutation.type.startsWith('update') || mutation.type === 'markNotificacionLeida';

        if (table && mutation.payload.id) {
          const snakePayload = toSnake(mutation.payload as Record<string, any>);
          
          if (isDelete) {
            const { error: deleteError } = await supabase.from(table).delete().eq('id', mutation.payload.id);
            if (deleteError) throw deleteError;
          } else if (isUpdate) {
            const { error: updateError } = await supabase.from(table).update(snakePayload).eq('id', mutation.payload.id);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase.from(table).insert(snakePayload);
            if (insertError) throw insertError;
          }
        }

        // Remover de la cola local
        setMutationQueue(prev => prev.filter(m => m.id !== mutation.id));
        successCount++;
      } catch (err) {
        failCount++;
        console.warn(`[Sync] Falló ${mutation.type} (intento ${mutation.retryCount + 1}):`, err);
        if (mutation.retryCount < 3) {
          // Re-encolar con retry incrementado
          setMutationQueue(prev => [...prev, { ...mutation, retryCount: mutation.retryCount + 1, timestamp: Date.now() + 5000 * (mutation.retryCount + 1) }]);
        } else {
          console.error(`[Sync] Mutación ${mutation.type} agotó reintentos y se descartó:`, mutation.id);
          // Descartar la mutación después de 3 intentos
          setMutationQueue(prev => prev.filter(m => m.id !== mutation.id));
        }
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

  // Auto-trigger forceSync cuando se recupera conexión
  const forceSyncRef = useRef(forceSync);
  forceSyncRef.current = forceSync;
  useEffect(() => {
    if (isOnline && mutationQueue.length > 0) {
      console.info(`[Sync] Conexión recuperada — sincronizando ${mutationQueue.length} cambios pendientes`);
      forceSyncRef.current();
    }
  }, [isOnline, mutationQueue.length]);
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

  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_proyectos', proyectos); }, [proyectos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_movimientos', movimientos); }, [movimientos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_empleados', empleados); }, [empleados]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_materiales', materiales); }, [materiales]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_ordenes', ordenes); }, [ordenes]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_proveedores', proveedores); }, [proveedores]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_eventos', eventos); }, [eventos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_bitacora', bitacora); }, [bitacora]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_presupuestos', presupuestos); }, [presupuestos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_licitaciones', licitaciones); }, [licitaciones]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_avances', avances); }, [avances]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_vales_salida', valesSalida); }, [valesSalida]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_seguimiento_evm', seguimientoEVM); }, [seguimientoEVM]);
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

  // ===== HANDLERS PARA TODAS LAS ENTIDADES =====
  const handleAddProyecto = useCallback(async (p: Omit<Proyecto, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setProyectos(prev => [nuevo, ...prev]);
    enqueueMutation('addProyecto', nuevo);
  }, [enqueueMutation]);

  const handleUpdateProyecto = useCallback(async (id: string, patch: Partial<Proyecto>) => {
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateProyecto', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteProyecto = useCallback(async (id: string) => {
    setProyectos(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteProyecto', { id });
  }, [enqueueMutation]);

  const handleAddMovimiento = useCallback(async (m: Omit<Movimiento, 'id'>) => {
    const nuevo = { ...m, id: uid() };
    setMovimientos(prev => [nuevo, ...prev]);
    enqueueMutation('addMovimiento', nuevo);
  }, [enqueueMutation]);

  const handleUpdateMovimiento = useCallback(async (id: string, patch: Partial<Movimiento>) => {
    setMovimientos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateMovimiento', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteMovimiento = useCallback(async (id: string) => {
    setMovimientos(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteMovimiento', { id });
  }, [enqueueMutation]);

  const handleAddEmpleado = useCallback(async (e: Omit<Empleado, 'id'>) => {
    const nuevo = { ...e, id: uid() };
    setEmpleados(prev => [nuevo, ...prev]);
    enqueueMutation('addEmpleado', nuevo);
  }, [enqueueMutation]);

  const handleUpdateEmpleado = useCallback(async (id: string, patch: Partial<Empleado>) => {
    setEmpleados(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateEmpleado', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteEmpleado = useCallback(async (id: string) => {
    setEmpleados(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteEmpleado', { id });
  }, [enqueueMutation]);

  const handleAddMaterial = useCallback(async (m: Omit<Material, 'id'>) => {
    const nuevo = { ...m, id: uid() };
    setMateriales(prev => [nuevo, ...prev]);
    enqueueMutation('addMaterial', nuevo);
  }, [enqueueMutation]);

  const handleUpdateMaterial = useCallback(async (id: string, patch: Partial<Material>) => {
    setMateriales(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateMaterial', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteMaterial = useCallback(async (id: string) => {
    setMateriales(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteMaterial', { id });
  }, [enqueueMutation]);

  const handleAddOrden = useCallback(async (o: Omit<OrdenCompra, 'id'>) => {
    const nuevo = { ...o, id: uid() };
    setOrdenes(prev => [nuevo, ...prev]);
    enqueueMutation('addOrden', nuevo);
  }, [enqueueMutation]);

  const handleUpdateOrden = useCallback(async (id: string, estado: OrdenCompra['estado']) => {
    setOrdenes(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
    if (estado === 'aprobado' || estado === 'recibida') {
      const orden = ordenes.find(o => o.id === id);
      if (orden?.items?.length) {
        orden.items.forEach(item => {
          setMateriales(prev => prev.map(m =>
            m.id === item.materialId ? { ...m, stock: m.stock + item.cantidad } : m
          ));
        });
      }
    }
    enqueueMutation('updateOrden', { id, estado });
  }, [enqueueMutation, ordenes]);

  const handleAddProveedor = useCallback(async (p: Omit<Proveedor, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setProveedores(prev => [nuevo, ...prev]);
    enqueueMutation('addProveedor', nuevo);
  }, [enqueueMutation]);

  const handleUpdateProveedor = useCallback(async (id: string, patch: Partial<Proveedor>) => {
    setProveedores(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateProveedor', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteProveedor = useCallback(async (id: string) => {
    setProveedores(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteProveedor', { id });
  }, [enqueueMutation]);

  const handleAddEvento = useCallback(async (e: Omit<EventoCalendario, 'id'>) => {
    const nuevo = { ...e, id: uid() };
    setEventos(prev => [nuevo, ...prev]);
    enqueueMutation('addEvento', nuevo);
  }, [enqueueMutation]);

  const handleUpdateEvento = useCallback(async (id: string, patch: Partial<EventoCalendario>) => {
    setEventos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateEvento', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteEvento = useCallback(async (id: string) => {
    setEventos(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteEvento', { id });
  }, [enqueueMutation]);

  const handleAddBitacora = useCallback(async (b: Omit<BitacoraEntry, 'id'>) => {
    const nuevo = { ...b, id: uid() };
    setBitacora(prev => [nuevo, ...prev]);
    enqueueMutation('addBitacora', nuevo);
  }, [enqueueMutation]);

  const handleUpdateBitacora = useCallback(async (id: string, patch: Partial<BitacoraEntry>) => {
    setBitacora(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateBitacora', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteBitacora = useCallback(async (id: string) => {
    setBitacora(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteBitacora', { id });
  }, [enqueueMutation]);

  const handleAddPresupuesto = useCallback(async (p: Omit<Presupuesto, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setPresupuestos(prev => [nuevo, ...prev]);
    enqueueMutation('addPresupuesto', nuevo);
  }, [enqueueMutation]);

  const handleUpdatePresupuesto = useCallback(async (id: string, patch: Partial<Presupuesto>) => {
    setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updatePresupuesto', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeletePresupuesto = useCallback(async (id: string) => {
    setPresupuestos(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deletePresupuesto', { id });
  }, [enqueueMutation]);

  const handleAddLicitacion = useCallback(async (l: Omit<Licitacion, 'id'>) => {
    const nuevo = { ...l, id: uid() };
    setLicitaciones(prev => [nuevo, ...prev]);
    enqueueMutation('addLicitacion', nuevo);
  }, [enqueueMutation]);

  const handleUpdateLicitacion = useCallback(async (id: string, patch: Partial<Licitacion>) => {
    setLicitaciones(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateLicitacion', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteLicitacion = useCallback(async (id: string) => {
    setLicitaciones(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteLicitacion', { id });
  }, [enqueueMutation]);

  const handleAddCotizacion = useCallback(async (c: Omit<CotizacionCliente, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nuevo = { ...c, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setCotizacionesNegocio(prev => [nuevo, ...prev]);
    enqueueMutation('addCotizacion', nuevo);
  }, [enqueueMutation]);

  const handleUpdateCotizacion = useCallback(async (id: string, patch: Partial<CotizacionCliente>) => {
    setCotizacionesNegocio(prev => prev.map(p => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
    enqueueMutation('updateCotizacion', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteCotizacion = useCallback(async (id: string) => {
    setCotizacionesNegocio(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteCotizacion', { id });
  }, [enqueueMutation]);

  const handleAddAvance = useCallback(async (a: Omit<AvanceObra, 'id'>) => {
    const nuevo = { ...a, id: uid() };
    setAvances(prev => [nuevo, ...prev]);
    enqueueMutation('addAvance', nuevo);
  }, [enqueueMutation]);

  const handleDeleteAvance = useCallback(async (id: string) => {
    setAvances(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteAvance', { id });
  }, [enqueueMutation]);

  const handleAddValeSalida = useCallback(async (v: Omit<ValeSalida, 'id'>) => {
    for (const item of v.items) {
      const mat = materiales.find(m => m.id === item.materialId);
      if (!mat || mat.stock < item.cantidad) {
        throw new Error(`Stock insuficiente: ${mat?.nombre ?? item.materialId} (disponible: ${mat?.stock ?? 0}, requerido: ${item.cantidad})`);
      }
    }
    const nuevo = { ...v, id: uid() };
    v.items.forEach(item => {
      setMateriales(prev => prev.map(m =>
        m.id === item.materialId ? { ...m, stock: m.stock - item.cantidad } : m
      ));
    });
    setValesSalida(prev => [nuevo, ...prev]);
    enqueueMutation('addValeSalida', nuevo);
  }, [enqueueMutation, materiales]);

  const handleDeleteValeSalida = useCallback(async (id: string) => {
    setValesSalida(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteValeSalida', { id });
  }, [enqueueMutation]);

  const handleAddCuentaCobrar = useCallback(async (c: Omit<CuentaCobrar, 'id'>) => {
    const nuevo = { ...c, id: uid() };
    setCuentasCobrar(prev => [nuevo, ...prev]);
    enqueueMutation('addCuentaCobrar', nuevo);
  }, [enqueueMutation]);

  const handleUpdateCuentaCobrar = useCallback(async (id: string, patch: Partial<CuentaCobrar>) => {
    setCuentasCobrar(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateCuentaCobrar', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteCuentaCobrar = useCallback(async (id: string) => {
    setCuentasCobrar(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteCuentaCobrar', { id });
  }, [enqueueMutation]);

  const handleAddCuentaPagar = useCallback(async (c: Omit<CuentaPagar, 'id'>) => {
    const nuevo = { ...c, id: uid() };
    setCuentasPagar(prev => [nuevo, ...prev]);
    enqueueMutation('addCuentaPagar', nuevo);
  }, [enqueueMutation]);

  const handleUpdateCuentaPagar = useCallback(async (id: string, patch: Partial<CuentaPagar>) => {
    setCuentasPagar(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateCuentaPagar', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteCuentaPagar = useCallback(async (id: string) => {
    setCuentasPagar(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteCuentaPagar', { id });
  }, [enqueueMutation]);

  const handleAddOrdenCambio = useCallback(async (o: Omit<OrdenCambio, 'id'>) => {
    const nuevo = { ...o, id: uid() };
    setOrdenesCambio(prev => [nuevo, ...prev]);
    enqueueMutation('addOrdenCambio', nuevo);
  }, [enqueueMutation]);

  const handleUpdateOrdenCambio = useCallback(async (id: string, patch: Partial<OrdenCambio>) => {
    setOrdenesCambio(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateOrdenCambio', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteOrdenCambio = useCallback(async (id: string) => {
    setOrdenesCambio(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteOrdenCambio', { id });
  }, [enqueueMutation]);

  const handleAddHito = useCallback(async (h: Omit<Hito, 'id'>) => {
    const nuevo = { ...h, id: uid() };
    setHitos(prev => [nuevo, ...prev]);
    enqueueMutation('addHito', nuevo);
  }, [enqueueMutation]);

  const handleUpdateHito = useCallback(async (id: string, patch: Partial<Hito>) => {
    setHitos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateHito', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteHito = useCallback(async (id: string) => {
    setHitos(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteHito', { id });
  }, [enqueueMutation]);

  const handleAddRiesgo = useCallback(async (r: Omit<Riesgo, 'id'>) => {
    const nuevo = { ...r, id: uid() };
    setRiesgos(prev => [nuevo, ...prev]);
    enqueueMutation('addRiesgo', nuevo);
  }, [enqueueMutation]);

  const handleUpdateRiesgo = useCallback(async (id: string, patch: Partial<Riesgo>) => {
    setRiesgos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateRiesgo', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteRiesgo = useCallback(async (id: string) => {
    setRiesgos(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteRiesgo', { id });
  }, [enqueueMutation]);

  const handleAddIncidente = useCallback(async (i: any) => {
    const nuevo = { ...i, id: uid() };
    setIncidentes(prev => [nuevo, ...prev]);
    enqueueMutation('addIncidente', nuevo);
  }, [enqueueMutation]);

  const handleUpdateIncidente = useCallback(async (id: string, patch: any) => {
    setIncidentes(prev => prev.map((p: any) => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateIncidente', { id, ...patch });
  }, [enqueueMutation]);

  const handleAddPublicacionMuro = useCallback(async (p: Omit<PublicacionMuro, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setPublicacionesMuro(prev => [nuevo, ...prev]);
    enqueueMutation('addPublicacionMuro', nuevo);
  }, [enqueueMutation]);

  const handleAddComentarioMuro = useCallback(async (pubId: string, c: Omit<ComentarioMuro, 'id'>) => {
    setPublicacionesMuro(prev => prev.map(p => p.id === pubId ? { ...p, comentarios: [...p.comentarios, { ...c, id: uid() }] } : p));
    enqueueMutation('addComentarioMuro', { pubId, ...c });
  }, [enqueueMutation]);

  const handleLikePublicacionMuro = useCallback(async (pubId: string) => {
    setPublicacionesMuro(prev => prev.map(p => p.id === pubId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    enqueueMutation('likePublicacionMuro', { pubId });
  }, [enqueueMutation]);

  const handleAddPrueba = useCallback(async (p: Omit<PruebaLaboratorio, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setPruebas(prev => [nuevo, ...prev]);
    enqueueMutation('addPrueba', nuevo);
  }, [enqueueMutation]);

  const handleUpdatePrueba = useCallback(async (id: string, patch: Partial<PruebaLaboratorio>) => {
    setPruebas(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updatePrueba', { id, ...patch });
  }, [enqueueMutation]);

  const handleAddNC = useCallback(async (n: Omit<NoConformidad, 'id'>) => {
    const nuevo = { ...n, id: uid() };
    setNcs(prev => [nuevo, ...prev]);
    enqueueMutation('addNC', nuevo);
  }, [enqueueMutation]);

  const handleUpdateNC = useCallback(async (id: string, patch: Partial<NoConformidad>) => {
    setNcs(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateNC', { id, ...patch });
  }, [enqueueMutation]);

  const handleAddLiberacion = useCallback(async (l: Omit<LiberacionPartida, 'id'>) => {
    const nuevo = { ...l, id: uid() };
    setLiberaciones(prev => [nuevo, ...prev]);
    enqueueMutation('addLiberacion', nuevo);
  }, [enqueueMutation]);

  const handleUpdateLiberacion = useCallback(async (id: string, patch: Partial<LiberacionPartida>) => {
    setLiberaciones(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateLiberacion', { id, ...patch });
  }, [enqueueMutation]);

  const handleAddPlano = useCallback(async (p: Omit<Plano, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setPlanos(prev => [nuevo, ...prev]);
    enqueueMutation('addPlano', nuevo);
  }, [enqueueMutation]);

  const handleUpdatePlano = useCallback(async (id: string, patch: Partial<Plano>) => {
    setPlanos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updatePlano', { id, ...patch });
  }, [enqueueMutation]);

  const handleAddRfi = useCallback(async (r: Omit<RFI, 'id'>) => {
    const nuevo = { ...r, id: uid() };
    setRfis(prev => [nuevo, ...prev]);
    enqueueMutation('addRfi', nuevo);
  }, [enqueueMutation]);

  const handleUpdateRfi = useCallback(async (id: string, patch: Partial<RFI>) => {
    setRfis(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateRfi', { id, ...patch });
  }, [enqueueMutation]);

  const handleAddSubmittal = useCallback(async (s: Omit<Submittal, 'id'>) => {
    const nuevo = { ...s, id: uid() };
    setSubmittals(prev => [nuevo, ...prev]);
    enqueueMutation('addSubmittal', nuevo);
  }, [enqueueMutation]);

  const handleUpdateSubmittal = useCallback(async (id: string, patch: Partial<Submittal>) => {
    setSubmittals(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateSubmittal', { id, ...patch });
  }, [enqueueMutation]);

  const handleAddActivo = useCallback(async (a: Omit<ActivoHerramienta, 'id'>) => {
    const nuevo = { ...a, id: uid() };
    setActivos(prev => [nuevo, ...prev]);
    enqueueMutation('addActivo', nuevo);
  }, [enqueueMutation]);

  const handleUpdateActivo = useCallback(async (id: string, patch: Partial<ActivoHerramienta>) => {
    setActivos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateActivo', { id, ...patch });
  }, [enqueueMutation]);

  const handleDeleteActivo = useCallback(async (id: string) => {
    setActivos(prev => prev.filter(p => p.id !== id));
    enqueueMutation('deleteActivo', { id });
  }, [enqueueMutation]);

  const handleAddCuadro = useCallback(async (c: Omit<CuadroComparativo, 'id'>) => {
    const nuevo = { ...c, id: uid() };
    setCuadros(prev => [nuevo, ...prev]);
    enqueueMutation('addCuadro', nuevo);
  }, [enqueueMutation]);

  const handleUpdateCuadro = useCallback(async (id: string, patch: Partial<CuadroComparativo>) => {
    setCuadros(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateCuadro', { id, ...patch });
  }, [enqueueMutation]);

  const handleAddPagoProveedor = useCallback(async (p: Omit<PagoProveedor, 'id'>) => {
    const nuevo = { ...p, id: uid() };
    setPagosProveedor(prev => [nuevo, ...prev]);
    enqueueMutation('addPagoProveedor', nuevo);
  }, [enqueueMutation]);

  const handleUpdatePagoProveedor = useCallback(async (id: string, patch: Partial<PagoProveedor>) => {
    setPagosProveedor(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updatePagoProveedor', { id, ...patch });
  }, [enqueueMutation]);

  // ===== FUNCIONES AUXILIARES PARA CONTEXT =====

  const getPresupuestoByProyecto = useCallback((proyectoId: string): Presupuesto | undefined => {
    return presupuestos.find(p => p.proyectoId === proyectoId);
  }, [presupuestos]);

  const avanceFinancieroCalculado = useCallback((proyectoId: string): number => {
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return 0;
    const presupuesto = presupuestos.find(p => p.proyectoId === proyectoId);
    if (!presupuesto || !presupuesto.totalCalculado) return 0;
    const totalReal = movimientos
      .filter(m => m.proyectoId === proyectoId)
      .reduce((sum, m) => sum + (m.costoTotal || m.monto || 0), 0);
    return Math.min(100, (totalReal / presupuesto.totalCalculado) * 100);
  }, [proyectos, presupuestos, movimientos]);

  const verificarStockCritico = useCallback(() => {
    materiales.forEach(m => {
      if (m.stock <= m.stockMinimo && m.critico !== false) {
        addNotificacion('stock_critico', 'Stock Crítico', `${m.nombre} tiene stock bajo: ${m.stock} ${m.unidad} (mínimo: ${m.stockMinimo})`, undefined, m.id, false);
      }
    });
  }, [materiales, addNotificacion]);

  const verificarOrdenesCambioPendientes = useCallback(() => {
    const pendientes = ordenesCambio.filter(o => o.estado === 'solicitud');
    if (pendientes.length > 0) {
      addNotificacion('orden_cambio_pendiente', 'Órdenes de Cambio Pendientes', `Hay ${pendientes.length} órdenes de cambio pendientes de revisión`, undefined, undefined, false);
    }
  }, [ordenesCambio, addNotificacion]);

  const verificarChecklistRechazado = useCallback((proyectoId: string) => {
    const liberacionesRechazadas = liberaciones.filter(l => l.proyectoId === proyectoId && l.estado === 'rechazado');
    if (liberacionesRechazadas.length > 0) {
      addNotificacion('checklist_rechazado', 'Checklist Rechazado', `Hay ${liberacionesRechazadas.length} checklist(s) rechazados en el proyecto`, proyectoId, undefined, false);
    }
  }, [liberaciones, addNotificacion]);

  const notifyAvanceRegistrado = useCallback((proyectoId: string, renglonNombre: string, avance: number) => {
    addNotificacion('avance_registrado', 'Avance Registrado', `Se registró avance del ${avance.toFixed(1)}% en "${renglonNombre}"`, proyectoId, undefined, true);
  }, [addNotificacion]);

  const notifyDesviacionRendimiento = useCallback((actividad: string, eficiencia: number, proyectoId: string) => {
    addNotificacion('desviacion_rendimiento', 'Desviación de Rendimiento', `La actividad "${actividad}" tiene eficiencia del ${eficiencia.toFixed(1)}% — fuera de rango esperado`, proyectoId, undefined, true);
  }, [addNotificacion]);

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


