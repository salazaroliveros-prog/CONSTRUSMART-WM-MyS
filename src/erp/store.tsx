import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
import { sanitizarObjeto, sanitizarTexto, getServerRole } from '@/lib/security';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import {
  Proyecto, Movimiento, Empleado, Material, OrdenCompra, Proveedor, EventoCalendario, BitacoraEntry, Presupuesto, Licitacion, AvanceObra, ValeSalida, Notificacion, OrdenCambio, SeguimientoEVM,
  CuentaCobrar, CuentaPagar, Hito, Riesgo, PublicacionMuro, ComentarioMuro, PruebaLaboratorio, NoConformidad, LiberacionPartida,
  Plano, RFI, Submittal, ActivoHerramienta, CuadroComparativo, PagoProveedor, CotizacionCliente,
} from './types';

import {
  proyectoSchema, movimientoSchema, cuentaCobrarSchema, cuentaPagarSchema, ordenCambioSchema,
  presupuestoSchema, cotizacionSchema, empleadoSchema, incidenteSchema, materialSchema,
  ordenSchema, proveedorSchema, eventoCalendarioSchema, eventoSchema, bitacoraEntrySchema,
  bitacoraSchema, seguimientoSchema, avanceObraSchema, hitoSchema, riesgoSchema, muroSchema,
  notificacionSchema, liberacionSchema, pruebaSchema, noConformidadSchema, activoSchema,
  licitacionSchema, cuadroSchema, pagoProveedorSchema, planoSchema, rfiSchema, submittalSchema,
} from './store/schemas';

const proyectoSchemaInline = z.object({
  id: z.string(), nombre: z.string(), ubicacion: z.string(),
  tipologia: z.enum(['residencial','comercial','industrial','civil','publica']),
  presupuestoTotal: z.number().default(0), montoContrato: z.number().default(0),
  cliente: z.string().default(''), presupuestoActualId: z.string().nullable().optional(),
  fechaInicio: z.string().default(''), fechaFin: z.string().default(''),
  fechaInicioReal: z.string().optional().default(''), fechaFinEstimada: z.string().optional().default(''),
  avanceFisico: z.number().default(0), avanceFinanciero: z.number().default(0),
  estado: z.enum(['planeacion','ejecucion','pausado','finalizado']).default('planeacion'),
  descripcion: z.string().optional().default(''),
  tipoObra: z.enum(['nueva','remodelacion','ampliacion']).optional().default('nueva'),
  clienteNit: z.string().optional().default(''), clienteTelefono: z.string().optional().default(''),
  clienteEmail: z.string().optional().default(''), direccion: z.string().optional().default(''),
  ciudad: z.string().optional().default(''), departamento: z.string().optional().default(''),
  codigoPostal: z.string().optional().default(''), pais: z.string().optional().default('Guatemala'),
  areaConstruccion: z.number().optional(), numPisos: z.number().optional(),
  plazoSemanas: z.number().optional(), ingenieroResidente: z.string().optional().default(''),
  supervisor: z.string().optional().default(''), arquitecto: z.string().optional().default(''),
  numeroExpediente: z.string().optional().default(''), numeroLicencia: z.string().optional().default(''),
  margenUtilidadObjetivo: z.number().optional(),
  moneda: z.enum(['GTQ','USD']).optional().default('GTQ'),
  etapa: z.enum(['planificacion','diseno','preconstruccion','construccion','cierre']).optional().default('planificacion'),
  lat: z.number().nullable().optional(), lng: z.number().nullable().optional(),
  latitud: z.number().nullable().optional(), longitud: z.number().nullable().optional(),
  factorSobrecosto: z.object({ indirectos: z.number(), administracion: z.number(), imprevistos: z.number(), utilidad: z.number() }).optional(),
}).transform(d => ({ ...d }));

import { safeLogger } from '@/lib/safeLogger';
import { scheduleHealthCheck } from '@/lib/store-health';
import { isDemoDataLoaded, markDemoLoaded, getDemoData, DEMO_PROYECTOS, DEMO_MOVIMIENTOS, DEMO_AVANCES, DEMO_MATERIALES, DEMO_EMPLEADOS, DEMO_PROVEEDORES, DEMO_ORDENES, DEMO_PRESUPUESTOS } from './demo-data';

const demoLoaded = (() => { try { return localStorage.getItem('wm_erp_demo_loaded') === 'true' || false; } catch { return false; } })();

function loadWithDemo<T>(key: string, schema: z.ZodTypeAny, demoArr: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      const result = z.array(schema).safeParse(parsed);
      if (result.success) return result.data;
    }
  } catch { safeLogger.warn(`[Storage] Corrupto: ${key}`); }
  if (!demoLoaded && demoArr.length > 0) {
    try { localStorage.setItem('wm_erp_demo_loaded', 'true'); } catch {}
    return demoArr;
  }
  return [];
}

function loadFromStorage<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    return JSON.parse(raw) as T;
  } catch {
    safeLogger.warn(`[Storage] Corrupto: ${key}`);
    return initial;
  }
}

const STORAGE_MAX_BYTES = 4.5 * 1024 * 1024;
const STORAGE_WARN_THRESHOLD = 3 * 1024 * 1024;
const BASE_STORAGE_KEY = 'wm_erp_data';
const QUEUE_KEY = 'wm_erp_queue';
const NOTIF_KEY = BASE_STORAGE_KEY + '_notificaciones';

function verificarEspacioStorage(tamanoNuevo: number): boolean {
  let espacioUsado = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) espacioUsado += localStorage.getItem(key)?.length || 0;
  }
  if (espacioUsado + tamanoNuevo > STORAGE_MAX_BYTES) return false;
  return true;
}

function saveToStorage<T>(key: string, data: T) {
  try {
    const jsonData = JSON.stringify(data);
    const tamano = new Blob([jsonData]).size;
    if (tamano === 0) return;
    const MAX_KEY_SIZE = 500 * 1024;
    if (tamano > MAX_KEY_SIZE) { console.warn(`[Storage] ${key} muy grande`); return; }
    if (!verificarEspacioStorage(tamano)) {
      Object.keys(localStorage).filter(k => k.startsWith(BASE_STORAGE_KEY)).sort().slice(0, 5).forEach(k => localStorage.removeItem(k));
    }
    localStorage.setItem(key, jsonData);
    localStorage.setItem(key + '_timestamp', String(Date.now()));
  } catch { console.error(`[Storage] Error guardar ${key}`); }
}

const toSnake = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key in obj) result[key.replace(/[A-Z]/g, c => '_' + c.toLowerCase())] = obj[key];
  return result;
};

const toCamel = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const key in obj) result[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = obj[key];
  return result;
};

export type View = 'login' | 'dashboard' | 'proyectos' | 'presupuestos' | 'seguimiento' | 'financiero' | 'rrhh' | 'bodega' | 'crm' | 'apu' | 'curvas' | 'baseprecios' | 'reportes' | 'muro' | 'ordenes-cambio' | 'notificaciones' | 'sso-calidad' | 'documentos' | 'visor-bim' | 'predictivo' | 'exportacion' | 'logistica' | 'rendimiento-campo' | 'comercial-fin' | 'admin-sistema' | 'planilla-destajos' | 'impuestos' | 'entradas-almacen' | 'ajustes' | 'hitos' | 'riesgos' | 'cuentas-cobrar' | 'cuentas-pagar' | 'cotizaciones';
export type UIMode = 'shadcn' | 'antd';
export type AppThemeMode = 'light' | 'dark' | 'high-contrast' | 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism';
export type Rol = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';
export type Reporte = 'cubicacion' | 'rendimientos' | 'ejecutivo';

export interface AppSettings {
  uiMode: UIMode; appTheme: AppThemeMode; primaryColor: string; language: 'es' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'; currency: 'GTQ' | 'USD';
  sidebarCollapsed: boolean; animationsEnabled: boolean; compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export const ALLOWED: Record<Rol, View[]> = {
  Administrador: ['dashboard','proyectos','presupuestos','seguimiento','financiero','rrhh','bodega','crm','apu','curvas','baseprecios','reportes','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','visor-bim','predictivo','exportacion','logistica','rendimiento-campo','comercial-fin','admin-sistema','planilla-destajos','impuestos','entradas-almacen','ajustes','hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones'],
  Gerente: ['dashboard','proyectos','presupuestos','seguimiento','financiero','rrhh','bodega','crm','apu','curvas','baseprecios','reportes','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','visor-bim','predictivo','exportacion','logistica','rendimiento-campo','comercial-fin','admin-sistema','planilla-destajos','impuestos','entradas-almacen','ajustes','hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones'],
  Residente: ['dashboard','proyectos','presupuestos','seguimiento','apu','curvas','baseprecios','reportes','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','hitos','riesgos','ajustes','cotizaciones'],
  Compras: ['dashboard','bodega','proyectos','cuentas-pagar','ajustes','cotizaciones'],
  Bodeguero: ['dashboard','bodega','ajustes'],
};

interface Mutation {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

interface ErpState {
  view: string; setView: (v: string) => void;
  user: { id: string; nombre: string; rol: Rol; avatar?: string } | null;
  initializing: boolean; allowedViews: View[]; authError: string;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, nombre: string, rol: Rol) => Promise<void>;
  signInWithGoogle: () => Promise<void>; logout: () => void; isOnline: boolean;
  proyectos: Proyecto[]; addProyecto: (p: Omit<Proyecto, 'id'>) => Promise<void>;
  updateProyecto: (id: string, patch: Partial<Proyecto>) => Promise<void>;
  deleteProyecto: (id: string) => Promise<void>;
  movimientos: Movimiento[]; addMovimiento: (m: Omit<Movimiento, 'id'>) => Promise<void>;
  updateMovimiento: (id: string, patch: Partial<Movimiento>) => Promise<void>;
  deleteMovimiento: (id: string) => Promise<void>;
  empleados: Empleado[]; addEmpleado: (e: Omit<Empleado, 'id'>) => Promise<void>;
  updateEmpleado: (id: string, patch: Partial<Empleado>) => Promise<void>;
  deleteEmpleado: (id: string) => Promise<void>;
  materiales: Material[]; addMaterial: (m: Omit<Material, 'id'>) => Promise<void>;
  updateMaterial: (id: string, patch: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  ordenes: OrdenCompra[]; updateOrden: (id: string, estado: OrdenCompra['estado']) => Promise<void>;
  addOrden: (o: Omit<OrdenCompra, 'id'>) => Promise<void>;
  proveedores: Proveedor[]; addProveedor: (p: Omit<Proveedor, 'id'>) => Promise<void>;
  updateProveedor: (id: string, patch: Partial<Proveedor>) => Promise<void>;
  deleteProveedor: (id: string) => Promise<void>;
  eventos: EventoCalendario[]; addEvento: (e: Omit<EventoCalendario, 'id'>) => Promise<void>;
  updateEvento: (id: string, patch: Partial<EventoCalendario>) => Promise<void>;
  deleteEvento: (id: string) => Promise<void>;
  bitacora: BitacoraEntry[]; addBitacora: (b: Omit<BitacoraEntry, 'id'>) => Promise<void>;
  updateBitacora: (id: string, patch: Partial<BitacoraEntry>) => Promise<void>;
  deleteBitacora: (id: string) => Promise<void>;
  presupuestos: Presupuesto[]; addPresupuesto: (p: Omit<Presupuesto, 'id'>) => Promise<void>;
  updatePresupuesto: (id: string, patch: Partial<Presupuesto>) => Promise<void>;
  deletePresupuesto: (id: string) => Promise<void>;
  getPresupuestoByProyecto: (proyectoId: string) => Presupuesto | undefined;
  selectedProyectoId: string | null; setSelectedProyectoId: (id: string | null) => void;
  licitaciones: Licitacion[]; addLicitacion: (l: Omit<Licitacion, 'id'>) => Promise<void>;
  updateLicitacion: (id: string, patch: Partial<Licitacion>) => Promise<void>;
  deleteLicitacion: (id: string) => Promise<void>;
  cotizacionesNegocio: CotizacionCliente[]; addCotizacion: (c: Omit<CotizacionCliente, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCotizacion: (id: string, patch: Partial<CotizacionCliente>) => Promise<void>;
  deleteCotizacion: (id: string) => Promise<void>;
  ventasPaquetes: any[]; addVentaPaquete: (v: any) => Promise<void>;
  avances: AvanceObra[]; addAvance: (a: Omit<AvanceObra, 'id'>) => Promise<void>;
  deleteAvance: (id: string) => Promise<void>;
  seguimientoEVM: SeguimientoEVM[];
  addSeguimiento: (s: Omit<SeguimientoEVM, 'id'>) => Promise<void>;
  updateSeguimiento: (id: string, patch: Partial<SeguimientoEVM>) => Promise<void>;
  deleteSeguimiento: (id: string) => Promise<void>;
  valesSalida: ValeSalida[]; addValeSalida: (v: Omit<ValeSalida, 'id'>) => Promise<void>;
  deleteValeSalida: (id: string) => Promise<void>;
  cuentasCobrar: CuentaCobrar[]; addCuentaCobrar: (c: Omit<CuentaCobrar, 'id'>) => Promise<void>;
  updateCuentaCobrar: (id: string, patch: Partial<CuentaCobrar>) => Promise<void>;
  deleteCuentaCobrar: (id: string) => Promise<void>;
  cuentasPagar: CuentaPagar[]; addCuentaPagar: (c: Omit<CuentaPagar, 'id'>) => Promise<void>;
  updateCuentaPagar: (id: string, patch: Partial<CuentaPagar>) => Promise<void>;
  deleteCuentaPagar: (id: string) => Promise<void>;
  ordenesCambio: OrdenCambio[]; addOrdenCambio: (o: Omit<OrdenCambio, 'id'>) => Promise<void>;
  updateOrdenCambio: (id: string, patch: Partial<OrdenCambio>) => Promise<void>;
  deleteOrdenCambio: (id: string) => Promise<void>;
  hitos: Hito[]; addHito: (h: Omit<Hito, 'id'>) => Promise<void>;
  updateHito: (id: string, patch: Partial<Hito>) => Promise<void>; deleteHito: (id: string) => Promise<void>;
  riesgos: Riesgo[]; addRiesgo: (r: Omit<Riesgo, 'id'>) => Promise<void>;
  updateRiesgo: (id: string, patch: Partial<Riesgo>) => Promise<void>;
  deleteRiesgo: (id: string) => Promise<void>;
  planos: Plano[]; addPlano: (p: Omit<Plano, 'id'>) => Promise<void>;
  updatePlano: (id: string, patch: Partial<Plano>) => Promise<void>;
  rfis: RFI[]; addRfi: (r: Omit<RFI, 'id'>) => Promise<void>;
  updateRfi: (id: string, patch: Partial<RFI>) => Promise<void>;
  submittals: Submittal[]; addSubmittal: (s: Omit<Submittal, 'id'>) => Promise<void>;
  updateSubmittal: (id: string, patch: Partial<Submittal>) => Promise<void>;
  activos: ActivoHerramienta[]; addActivo: (a: Omit<ActivoHerramienta, 'id'>) => Promise<void>;
  updateActivo: (id: string, patch: Partial<ActivoHerramienta>) => Promise<void>;
  deleteActivo: (id: string) => Promise<void>;
  cuadros: CuadroComparativo[]; addCuadro: (c: Omit<CuadroComparativo, 'id'>) => Promise<void>;
  updateCuadro: (id: string, patch: Partial<CuadroComparativo>) => Promise<void>;
  pagosProveedor: PagoProveedor[]; addPagoProveedor: (p: Omit<PagoProveedor, 'id'>) => Promise<void>;
  updatePagoProveedor: (id: string, patch: Partial<PagoProveedor>) => Promise<void>;
  incidentes: any[]; addIncidente: (i: any) => Promise<void>; updateIncidente: (id: string, patch: any) => Promise<void>;
  publicacionesMuro: PublicacionMuro[]; addPublicacionMuro: (p: Omit<PublicacionMuro, 'id'>) => Promise<void>;
  addComentarioMuro: (pubId: string, c: Omit<ComentarioMuro, 'id'>) => Promise<void>;
  likePublicacionMuro: (pubId: string) => Promise<void>;
  pruebas: PruebaLaboratorio[]; addPrueba: (p: Omit<PruebaLaboratorio, 'id'>) => Promise<void>;
  updatePrueba: (id: string, patch: Partial<PruebaLaboratorio>) => Promise<void>;
  ncs: NoConformidad[]; addNC: (n: Omit<NoConformidad, 'id'>) => Promise<void>;
  updateNC: (id: string, patch: Partial<NoConformidad>) => Promise<void>;
  liberaciones: LiberacionPartida[]; addLiberacion: (l: Omit<LiberacionPartida, 'id'>) => Promise<void>;
  updateLiberacion: (id: string, patch: Partial<LiberacionPartida>) => Promise<void>;
  mutationQueue: Mutation[]; syncMessage: string; forceSync: () => Promise<void>;
  notificaciones: Notificacion[]; notificacionesNoLeidas: number;
  addNotificacion: (tipo: Notificacion['tipo'], titulo: string, mensaje: string, proyectoId?: string, referenciaId?: string) => Promise<void>;
  markNotificacionLeida: (id: string) => void; marcarTodasLeidas: () => void;
  verificarStockCritico: () => void; verificarOrdenesCambioPendientes: () => void;
  verificarChecklistRechazado: (proyectoId: string) => void;
  notifyAvanceRegistrado: (proyectoId: string, renglonNombre: string, avance: number) => void;
  notifyDesviacionRendimiento: (actividad: string, eficiencia: number, proyectoId: string) => void;
  appSettings: AppSettings; updateAppSettings: (patch: Partial<AppSettings>) => void;
  avanceFinancieroCalculado: (proyectoId: string) => number;
  enqueueMutation: (type: string, payload: Record<string, any>) => string;
}

const Ctx = createContext<ErpState>({} as ErpState);
export const useErp = () => useContext(Ctx);

export const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0>>(c==='x'?0:1)).toString(16));
};

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'salazaroliveros@gmail.com';

const mapRol = (rol: string, email?: string): Rol => {
  const validRoles: Rol[] = ['Administrador','Gerente','Residente','Compras','Bodeguero'];
  if (validRoles.includes(rol as Rol)) return rol as Rol;
  if (email === ADMIN_EMAIL) return 'Administrador';
  return 'Residente';
};

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<string>('login');
  const [initializing, setInitializing] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  const auth = useAuth();
  const user = auth.user as ErpState['user'] | null;
  const authError = auth.error;

  // Timeout de seguridad: si initializing no resuelve en 8s, forzar false
  useEffect(() => {
    const timer = setTimeout(() => {
      if (initializing) {
        console.warn('[Store] initializing timeout — forzando false');
        setInitializing(false);
      }
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (auth.user) {
      if (view === 'login') setView('dashboard');
      if (initializing) setInitializing(false);
      return;
    }
    if (auth.error) {
      console.warn('[Store] auth.error detectado:', auth.error);
      if (initializing) setInitializing(false);
      return;
    }
    if (auth.loading === false && initializing) {
      setInitializing(false);
    }
  }, [auth.user, auth.error, auth.loading, initializing, view]);

  const fetchedRef = useRef(false);
  const isOnlineRef = useRef(navigator.onLine);
  useEffect(() => {
    const hO = () => isOnlineRef.current = true;
    const hOff = () => isOnlineRef.current = false;
    window.addEventListener('online', hO); window.addEventListener('offline', hOff);
    return () => { window.removeEventListener('online', hO); window.removeEventListener('offline', hOff); };
  }, []);

  // ===== CARGA DE DATOS CON DEMO INLINE =====
  // Los initializers de useState se ejecutan ANTES del primer render
  // Si no hay datos en localStorage y demo no se ha cargado, retorna datos demo

  const [proyectos, setProyectos] = useState<Proyecto[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_proyectos', proyectoSchema, DEMO_PROYECTOS as unknown as Proyecto[]));
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_movimientos', movimientoSchema, DEMO_MOVIMIENTOS as unknown as Movimiento[]));
  const [empleados, setEmpleados] = useState<Empleado[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_empleados', empleadoSchema, DEMO_EMPLEADOS as unknown as Empleado[]));
  const [materiales, setMateriales] = useState<Material[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_materiales', materialSchema, DEMO_MATERIALES as unknown as Material[]));
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_ordenes', ordenSchema, DEMO_ORDENES as unknown as OrdenCompra[]));
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_proveedores', proveedorSchema, DEMO_PROVEEDORES as unknown as Proveedor[]));
  const [eventos, setEventos] = useState<EventoCalendario[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_eventos', eventoSchema, []));
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_presupuestos', presupuestoSchema, DEMO_PRESUPUESTOS as unknown as Presupuesto[]));
  const [avances, setAvances] = useState<AvanceObra[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_avances', avanceObraSchema, DEMO_AVANCES as unknown as AvanceObra[]));

  const [cuentasCobrar, setCuentasCobrar] = useState<CuentaCobrar[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_cuentas_cobrar', cuentaCobrarSchema, []));
  const [cuentasPagar, setCuentasPagar] = useState<CuentaPagar[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_cuentas_pagar', cuentaPagarSchema, []));
  const [ordenesCambio, setOrdenesCambio] = useState<OrdenCambio[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_ordenes_cambio', ordenCambioSchema, []));
  const [hitos, setHitos] = useState<Hito[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_hitos', hitoSchema, []));
  const [riesgos, setRiesgos] = useState<Riesgo[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_riesgos', riesgoSchema, []));
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_licitaciones', licitacionSchema, []));
  const [cotizacionesNegocio, setCotizacionesNegocio] = useState<CotizacionCliente[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_cotizacionesNegocio', cotizacionSchema, []));
  const [ventasPaquetes, setVentasPaquetes] = useState<any[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_ventasPaquetes', z.any(), []));
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_bitacora', bitacoraSchema, []));
  const [pruebas, setPruebas] = useState<PruebaLaboratorio[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_pruebas', pruebaSchema, []));
  const [ncs, setNcs] = useState<NoConformidad[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_no_conformidades', noConformidadSchema, []));
  const [valesSalida, setValesSalida] = useState<ValeSalida[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_vales_salida', avanceObraSchema, []));
  const [seguimientoEVM, setSeguimientoEVM] = useState<SeguimientoEVM[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_seguimiento_evm', seguimientoSchema, []));
  const [incidentes, setIncidentes] = useState<any[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_incidentes', incidenteSchema, []));
  const [publicacionesMuro, setPublicacionesMuro] = useState<PublicacionMuro[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_publicaciones_muro', muroSchema, []));
  const [liberaciones, setLiberaciones] = useState<LiberacionPartida[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_liberaciones', liberacionSchema, []));
  const [planos, setPlanos] = useState<Plano[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_planos', planoSchema, []));
  const [rfis, setRfis] = useState<RFI[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_rfis', rfiSchema, []));
  const [submittals, setSubmittals] = useState<Submittal[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_submittals', submittalSchema, []));
  const [activos, setActivos] = useState<ActivoHerramienta[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_activos', activoSchema, []));
  const [cuadros, setCuadros] = useState<CuadroComparativo[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_cuadros', cuadroSchema, []));
  const [pagosProveedor, setPagosProveedor] = useState<PagoProveedor[]>(() => loadWithDemo(BASE_STORAGE_KEY + '_pagos_proveedor', pagoProveedorSchema, []));

  const [mutationQueue, setMutationQueue] = useState<Mutation[]>(() => loadFromStorage(QUEUE_KEY, []));
  const [syncMessage, setSyncMessage] = useState('');
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() => loadFromStorage(NOTIF_KEY, []));
  const [syncCooldown, setSyncCooldown] = useState(false);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(null);

  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadFromStorage(BASE_STORAGE_KEY + '_settings', {
    uiMode: 'antd', appTheme: 'ant-design', primaryColor: '#ff8c42', language: 'es',
    dateFormat: 'DD/MM/YYYY', currency: 'GTQ', sidebarCollapsed: false, animationsEnabled: true,
    compactMode: false, fontSize: 'medium',
  }));

  const updateAppSettings = useCallback((patch: Partial<AppSettings>) => {
    setAppSettings(prev => { const next = { ...prev, ...patch }; saveToStorage(BASE_STORAGE_KEY + '_settings', next); return next; });
  }, []);

  // Health check
  useEffect(() => {
    const cancel = scheduleHealthCheck(() => ({
      proyectos: proyectos.length, movimientos: movimientos.length, mutationQueue: mutationQueue.length,
      notificaciones: notificaciones.length, isOnline, user: !!user,
    }), 'ErpProvider', 600000);
    return cancel;
  }, []);

  // Fetch initial data from Supabase
  useEffect(() => {
    if (!user || fetchedRef.current || !hasSupabase || !isOnlineRef.current) return;
    fetchedRef.current = true;
    const fetchTable = async (t: string) => { try { const { data, error } = await supabase.from(t).select('*'); if (!error && data) return data as Record<string, unknown>[]; } catch {} return null; };
    (async () => {
      let pd, md, ed, matd, od, provd, presd, ccd, cpd, ocd, hd, rd, licd, cotd, pubd, pland, rfid, subd, vpd;
      try { [pd, md, ed, matd, od, provd, presd, ccd, cpd, ocd, hd, rd, licd, cotd, pubd, pland, rfid, subd, vpd] = await Promise.all([
        fetchTable('erp_proyectos'), fetchTable('erp_movimientos'), fetchTable('erp_empleados'),
        fetchTable('erp_materiales'), fetchTable('erp_ordenes_compra'), fetchTable('erp_proveedores'),
        fetchTable('erp_presupuestos'), fetchTable('erp_cuentas_cobrar'), fetchTable('erp_cuentas_pagar'),
        fetchTable('erp_ordenes_cambio'), fetchTable('erp_hitos'), fetchTable('erp_riesgos'),
        fetchTable('erp_licitaciones'), fetchTable('erp_cotizaciones_negocio'), fetchTable('erp_publicaciones_muro'),
        fetchTable('erp_planos'), fetchTable('erp_rfis'), fetchTable('erp_submittals'), fetchTable('ventas_paquetes'),
      ]); } catch {}
      const assign = (setter: (v: any[]) => void, raw: any[] | null) => { if (Array.isArray(raw)) setter(raw.map((item: any) => typeof item === 'object' && item ? toCamel(item) : {})); };
      if (pd) assign((v: any) => setProyectos(v), pd);
      if (md) assign((v: any) => setMovimientos(v), md);
      if (ed) assign((v: any) => setEmpleados(v), ed);
      if (matd) assign((v: any) => setMateriales(v), matd);
      if (od) assign((v: any) => setOrdenes(v), od);
      if (provd) assign((v: any) => setProveedores(v), provd);
      if (presd) assign((v: any) => setPresupuestos(v), presd);
      if (ccd) assign((v: any) => setCuentasCobrar(v), ccd);
      if (cpd) assign((v: any) => setCuentasPagar(v), cpd);
      if (ocd) assign((v: any) => setOrdenesCambio(v), ocd);
      if (hd) assign((v: any) => setHitos(v), hd);
      if (rd) assign((v: any) => setRiesgos(v), rd);
      if (licd) assign((v: any) => setLicitaciones(v), licd);
      if (cotd) assign((v: any) => setCotizacionesNegocio(v), cotd);
      if (vpd) assign((v: any) => setVentasPaquetes(v), vpd);
      if (pubd) assign((v: any) => setPublicacionesMuro(v), pubd);
      if (pland) assign((v: any) => setPlanos(v), pland);
      if (rfid) assign((v: any) => setRfis(v), rfid);
      if (subd) assign((v: any) => setSubmittals(v), subd);
    })();
  }, [user]);

  // forceSync
  const forceSync = useCallback(async () => {
    if (syncCooldown || mutationQueue.length === 0 || !isOnline) return;
    setSyncCooldown(true);
    setSyncMessage(`Sincronizando ${mutationQueue.length} cambios...`);
    const queue = [...mutationQueue];
    let successCount = 0;
    let failCount = 0;
    for (const mutation of queue) {
      try {
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
          addLiberacion: 'erp_liberaciones_partida', updateLiberacion: 'erp_liberaciones_partida',
          addPlano: 'erp_planos', updatePlano: 'erp_planos',
          addRfi: 'erp_rfis', updateRfi: 'erp_rfis',
          addSubmittal: 'erp_submittals', updateSubmittal: 'erp_submittals',
          addActivo: 'activos_herramientas', updateActivo: 'activos_herramientas',
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
          if (isDelete) { const { error } = await supabase.from(table).delete().eq('id', mutation.payload.id); if (error) throw error; }
          else if (isUpdate) { const { error } = await supabase.from(table).update(snakePayload).eq('id', mutation.payload.id); if (error) throw error; }
          else { const { error } = await supabase.from(table).insert(snakePayload); if (error) throw error; }
        }
        setMutationQueue(prev => prev.filter(m => m.id !== mutation.id));
        successCount++;
      } catch (err) {
        failCount++;
        if (mutation.retryCount < 3) setMutationQueue(prev => [...prev, { ...mutation, retryCount: mutation.retryCount + 1, timestamp: Date.now() + 5000 * (mutation.retryCount + 1) }]);
        else setMutationQueue(prev => prev.filter(m => m.id !== mutation.id));
      }
    }
    setSyncMessage(failCount > 0 ? `${successCount} sincronizados, ${failCount} fallaron` : `${successCount} cambios sincronizados`);
    setTimeout(() => setSyncMessage(''), 3000);
    setSyncCooldown(false);
  }, [mutationQueue, isOnline, syncCooldown]);

  useEffect(() => { saveToStorage(NOTIF_KEY, notificaciones); }, [notificaciones]);

  const forceSyncRef = useRef(forceSync);
  forceSyncRef.current = forceSync;
  useEffect(() => { if (isOnline && mutationQueue.length > 0) forceSyncRef.current(); }, [isOnline, mutationQueue.length]);

  const notificacionesNoLeidas = React.useMemo(() => notificaciones.filter(n => !n.leido).length, [notificaciones]);
  const readyRef = useRef(false);

  const enqueueMutation = useCallback((type: string, payload: Record<string, any>) => {
    const mutation: Mutation = { id: uid(), type, payload, timestamp: Date.now(), retryCount: 0 };
    setMutationQueue(q => { const trimmed = q.length >= 100 ? q.slice(1) : q; return [...trimmed, mutation]; });
    return mutation.id;
  }, []);

  const addNotificacion = useCallback(async (tipo: string, titulo: string, mensaje: string, proyectoId?: string, referenciaId?: string) => {
    const nueva: Notificacion = {
      id: uid(), tipo: tipo as any, titulo, mensaje, proyectoId, referenciaId, leido: false, createdAt: new Date().toISOString(),
    };
    setNotificaciones(prev => [nueva, ...prev]);
    enqueueMutation('addNotificacion', nueva);
    if (!readyRef.current) return;
    toast(titulo, { description: mensaje, duration: 4000 });
  }, [enqueueMutation]);

  const markNotificacionLeida = useCallback((id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    enqueueMutation('markNotificacionLeida', { id, leido: true });
  }, [enqueueMutation]);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    notificaciones.filter(n => !n.leido).forEach(n => enqueueMutation('markNotificacionLeida', { id: n.id, leido: true }));
  }, [enqueueMutation, notificaciones]);

  // Persistencia
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_proyectos', proyectos); }, [proyectos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_movimientos', movimientos); }, [movimientos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_empleados', empleados); }, [empleados]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_materiales', materiales); }, [materiales]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_ordenes', ordenes); }, [ordenes]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_proveedores', proveedores); }, [proveedores]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_presupuestos', presupuestos); }, [presupuestos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_avances', avances); }, [avances]);

  // Handlers
  const handleAddProyecto = useCallback(async (p: Omit<Proyecto, 'id'>) => { const n = { ...p, id: uid() }; setProyectos(prev => [n, ...prev]); enqueueMutation('addProyecto', n); }, [enqueueMutation]);
  const handleUpdateProyecto = useCallback(async (id: string, patch: Partial<Proyecto>) => { setProyectos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); enqueueMutation('updateProyecto', { id, ...patch }); }, [enqueueMutation]);
  const handleDeleteProyecto = useCallback(async (id: string) => { setProyectos(prev => prev.filter(p => p.id !== id)); enqueueMutation('deleteProyecto', { id }); }, [enqueueMutation]);
  const handleAddMovimiento = useCallback(async (m: Omit<Movimiento, 'id'>) => { const n = { ...m, id: uid() }; setMovimientos(prev => [n, ...prev]); enqueueMutation('addMovimiento', n); }, [enqueueMutation]);
  const handleUpdateMovimiento = useCallback(async (id: string, patch: Partial<Movimiento>) => { setMovimientos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); enqueueMutation('updateMovimiento', { id, ...patch }); }, [enqueueMutation]);
  const handleDeleteMovimiento = useCallback(async (id: string) => { setMovimientos(prev => prev.filter(p => p.id !== id)); enqueueMutation('deleteMovimiento', { id }); }, [enqueueMutation]);
  const handleAddEmpleado = useCallback(async (e: Omit<Empleado, 'id'>) => { const n = { ...e, id: uid() }; setEmpleados(prev => [n, ...prev]); enqueueMutation('addEmpleado', n); }, [enqueueMutation]);
  const handleUpdateEmpleado = useCallback(async (id: string, patch: Partial<Empleado>) => { setEmpleados(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); enqueueMutation('updateEmpleado', { id, ...patch }); }, [enqueueMutation]);
  const handleDeleteEmpleado = useCallback(async (id: string) => { setEmpleados(prev => prev.filter(p => p.id !== id)); enqueueMutation('deleteEmpleado', { id }); }, [enqueueMutation]);
  const handleAddMaterial = useCallback(async (m: Omit<Material, 'id'>) => { const n = { ...m, id: uid() }; setMateriales(prev => [n, ...prev]); enqueueMutation('addMaterial', n); }, [enqueueMutation]);
  const handleUpdateMaterial = useCallback(async (id: string, patch: Partial<Material>) => { setMateriales(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); enqueueMutation('updateMaterial', { id, ...patch }); }, [enqueueMutation]);
  const handleDeleteMaterial = useCallback(async (id: string) => { setMateriales(prev => prev.filter(p => p.id !== id)); enqueueMutation('deleteMaterial', { id }); }, [enqueueMutation]);
  const handleAddOrden = useCallback(async (o: Omit<OrdenCompra, 'id'>) => { const n = { ...o, id: uid() }; setOrdenes(prev => [n, ...prev]); enqueueMutation('addOrden', n); }, [enqueueMutation]);
  const handleUpdateOrden = useCallback(async (id: string, estado: OrdenCompra['estado']) => { setOrdenes(prev => prev.map(p => p.id === id ? { ...p, estado } : p)); enqueueMutation('updateOrden', { id, estado }); }, [enqueueMutation]);
  const handleAddProveedor = useCallback(async (p: Omit<Proveedor, 'id'>) => { const n = { ...p, id: uid() }; setProveedores(prev => [n, ...prev]); enqueueMutation('addProveedor', n); }, [enqueueMutation]);
  const handleUpdateProveedor = useCallback(async (id: string, patch: Partial<Proveedor>) => { setProveedores(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); enqueueMutation('updateProveedor', { id, ...patch }); }, [enqueueMutation]);
  const handleDeleteProveedor = useCallback(async (id: string) => { setProveedores(prev => prev.filter(p => p.id !== id)); enqueueMutation('deleteProveedor', { id }); }, [enqueueMutation]);
  const handleAddPresupuesto = useCallback(async (p: Omit<Presupuesto, 'id'>) => { const n = { ...p, id: uid() }; setPresupuestos(prev => [n, ...prev]); enqueueMutation('addPresupuesto', n); }, [enqueueMutation]);
  const handleUpdatePresupuesto = useCallback(async (id: string, patch: Partial<Presupuesto>) => { setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); enqueueMutation('updatePresupuesto', { id, ...patch }); }, [enqueueMutation]);
  const handleDeletePresupuesto = useCallback(async (id: string) => { setPresupuestos(prev => prev.filter(p => p.id !== id)); enqueueMutation('deletePresupuesto', { id }); }, [enqueueMutation]);
  const handleAddAvance = useCallback(async (a: Omit<AvanceObra, 'id'>) => { const n = { ...a, id: uid() }; setAvances(prev => [n, ...prev]); enqueueMutation('addAvance', n); }, [enqueueMutation]);
  const handleDeleteAvance = useCallback(async (id: string) => { setAvances(prev => prev.filter(p => p.id !== id)); enqueueMutation('deleteAvance', { id }); }, [enqueueMutation]);
  const handleAddLicitacion = useCallback(async (l: Omit<Licitacion, 'id'>) => { const n = { ...l, id: uid() }; setLicitaciones(prev => [n, ...prev]); enqueueMutation('addLicitacion', n); }, [enqueueMutation]);
  const handleUpdateLicitacion = useCallback(async (id: string, patch: Partial<Licitacion>) => { setLicitaciones(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); enqueueMutation('updateLicitacion', { id, ...patch }); }, [enqueueMutation]);
  const handleDeleteLicitacion = useCallback(async (id: string) => { setLicitaciones(prev => prev.filter(p => p.id !== id)); enqueueMutation('deleteLicitacion', { id }); }, [enqueueMutation]);
  const handleAddCotizacion = useCallback(async (c: Omit<CotizacionCliente, 'id' | 'createdAt' | 'updatedAt'>) => { const n = { ...c, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; setCotizacionesNegocio(prev => [n, ...prev]); enqueueMutation('addCotizacion', n); }, [enqueueMutation]);
  const handleUpdateCotizacion = useCallback(async (id: string, patch: Partial<CotizacionCliente>) => { setCotizacionesNegocio(prev => prev.map(p => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)); enqueueMutation('updateCotizacion', { id, ...patch }); }, [enqueueMutation]);
  const handleDeleteCotizacion = useCallback(async (id: string) => { setCotizacionesNegocio(prev => prev.filter(p => p.id !== id)); enqueueMutation('deleteCotizacion', { id }); }, [enqueueMutation]);

  const getPresupuestoByProyecto = useCallback((proyectoId: string) => presupuestos.find(p => p.proyectoId === proyectoId), [presupuestos]);

  const value = useMemo(() => ({
    view, setView, user, initializing, isOnline,
    proyectos, addProyecto: handleAddProyecto, updateProyecto: handleUpdateProyecto, deleteProyecto: handleDeleteProyecto,
    movimientos, addMovimiento: handleAddMovimiento, updateMovimiento: handleUpdateMovimiento, deleteMovimiento: handleDeleteMovimiento,
    empleados, addEmpleado: handleAddEmpleado, updateEmpleado: handleUpdateEmpleado, deleteEmpleado: handleDeleteEmpleado,
    materiales, addMaterial: handleAddMaterial, updateMaterial: handleUpdateMaterial, deleteMaterial: handleDeleteMaterial,
    ordenes, addOrden: handleAddOrden, updateOrden: handleUpdateOrden,
    proveedores, addProveedor: handleAddProveedor, updateProveedor: handleUpdateProveedor, deleteProveedor: handleDeleteProveedor,
    eventos, addEvento: async () => {}, updateEvento: async () => {}, deleteEvento: async () => {},
    bitacora, addBitacora: async () => {}, updateBitacora: async () => {}, deleteBitacora: async () => {},
    presupuestos, addPresupuesto: handleAddPresupuesto, updatePresupuesto: handleUpdatePresupuesto, deletePresupuesto: handleDeletePresupuesto,
    getPresupuestoByProyecto, selectedProyectoId, setSelectedProyectoId,
    licitaciones, addLicitacion: handleAddLicitacion, updateLicitacion: handleUpdateLicitacion, deleteLicitacion: handleDeleteLicitacion,
    cotizacionesNegocio, addCotizacion: handleAddCotizacion, updateCotizacion: handleUpdateCotizacion, deleteCotizacion: handleDeleteCotizacion,
    ventasPaquetes, addVentaPaquete: async () => {},
    avances, addAvance: handleAddAvance, deleteAvance: handleDeleteAvance,
    seguimientoEVM,
    addSeguimiento: async () => {}, updateSeguimiento: async () => {}, deleteSeguimiento: async () => {},
    avanceFinancieroCalculado: () => 0,
    valesSalida, addValeSalida: async () => {}, deleteValeSalida: async () => {},
    cuentasCobrar, addCuentaCobrar: async () => {}, updateCuentaCobrar: async () => {}, deleteCuentaCobrar: async () => {},
    cuentasPagar, addCuentaPagar: async () => {}, updateCuentaPagar: async () => {}, deleteCuentaPagar: async () => {},
    ordenesCambio, addOrdenCambio: async () => {}, updateOrdenCambio: async () => {}, deleteOrdenCambio: async () => {},
    hitos, addHito: async () => {}, updateHito: async () => {}, deleteHito: async () => {},
    riesgos, addRiesgo: async () => {}, updateRiesgo: async () => {}, deleteRiesgo: async () => {},
    planos, addPlano: async () => {}, updatePlano: async () => {},
    rfis, addRfi: async () => {}, updateRfi: async () => {},
    submittals, addSubmittal: async () => {}, updateSubmittal: async () => {},
    activos, addActivo: async () => {}, updateActivo: async () => {}, deleteActivo: async () => {},
    cuadros, addCuadro: async () => {}, updateCuadro: async () => {},
    pagosProveedor, addPagoProveedor: async () => {}, updatePagoProveedor: async () => {},
    incidentes, addIncidente: async () => {}, updateIncidente: async () => {},
    publicacionesMuro, addPublicacionMuro: async () => {}, addComentarioMuro: async () => {}, likePublicacionMuro: async () => {},
    pruebas, addPrueba: async () => {}, updatePrueba: async () => {},
    ncs, addNC: async () => {}, updateNC: async () => {},
    liberaciones, addLiberacion: async () => {}, updateLiberacion: async () => {},
    notificaciones, notificacionesNoLeidas, addNotificacion, markNotificacionLeida, marcarTodasLeidas,
    mutationQueue, syncMessage, forceSync,
    appSettings, updateAppSettings, enqueueMutation,
    signIn: auth.signIn, signUp: auth.signUp, signInWithGoogle: auth.signInWithGoogle, logout: auth.logout,
    authError: auth.error,
    allowedViews: user ? ALLOWED[(user.rol as Rol) || 'Residente'] || ALLOWED['Residente'] : [],
    verificarStockCritico: () => {}, verificarOrdenesCambioPendientes: () => {}, verificarChecklistRechazado: () => {},
    notifyAvanceRegistrado: () => {}, notifyDesviacionRendimiento: () => {},
  }), [view, user, initializing, isOnline, proyectos, movimientos, empleados, materiales, ordenes, proveedores,
    presupuestos, licitaciones, cotizacionesNegocio, ventasPaquetes, avances, notificaciones, notificacionesNoLeidas,
    mutationQueue, syncMessage, forceSync, appSettings, enqueueMutation, auth]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};