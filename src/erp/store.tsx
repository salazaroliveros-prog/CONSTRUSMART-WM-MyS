import React, { createContext, useContext, useEffect, useRef, useMemo } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { scheduleHealthCheck } from '@/lib/store-health';
import { isDemoDataLoaded, markDemoLoaded, getDemoData } from './demo-data';
import { useErpStore, fetchInitialData } from './zustandStore';
import {
  proyectoSchema, movimientoSchema, cuentaCobrarSchema, cuentaPagarSchema, ordenCambioSchema,
  presupuestoSchema, cotizacionSchema, empleadoSchema, incidenteSchema, materialSchema,
  ordenSchema, proveedorSchema, eventoCalendarioSchema, eventoSchema, bitacoraEntrySchema,
  bitacoraSchema, seguimientoSchema, avanceObraSchema, hitoSchema, riesgoSchema, muroSchema,
  notificacionSchema, liberacionSchema, pruebaSchema, noConformidadSchema, activoSchema,
  licitacionSchema, cuadroSchema, pagoProveedorSchema, planoSchema, rfiSchema, submittalSchema,
  destajoSchema, recepcionAlmacenSchema, ventaPaqueteSchema, valeSalidaSchema,
} from './store/schemas';
import { setEmpresaInfo, APP_SETTINGS_DEFAULTS, compressData, decompressData, safeSetItem, isStorageQuotaCritical } from './utils';
import { safeLogger } from '@/lib/safeLogger';
import type { AppSettings, Mutation } from './store';

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
  motivoPausa: z.string().optional().default(''),
  pausadoPor: z.string().optional().default(''),
  fechaPausa: z.string().optional().default(''),
  fechaReanudacionEstimada: z.string().optional().default(''),
  version: z.number().optional(),
}).transform(d => ({ ...d }));

const BASE_STORAGE_KEY = 'wm_erp_data';
const QUEUE_KEY = 'wm_erp_queue';
const NOTIF_KEY = BASE_STORAGE_KEY + '_notificaciones';
const AUDIT_KEY = BASE_STORAGE_KEY + '_audit_log';

function loadWithDemo<T>(key: string, schema: z.ZodTypeAny, demoArr: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const decompressed = decompressData(raw);
      if (decompressed === null) { safeLogger.warn(`[Storage] Decompress fail: ${key}`); }
      const source = decompressed !== null ? decompressed : JSON.parse(raw);
      const result = z.array(schema).safeParse(source);
      if (result.success) return result.data;
    }
  } catch { safeLogger.warn(`[Storage] Corrupto: ${key}`); }
  if (!isDemoDataLoaded() && demoArr.length > 0) {
    try { markDemoLoaded(); } catch {}
    return demoArr;
  }
  return [];
}

const demoDataMap: Record<string, any[]> = {
  proyectos: getDemoData('DEMO_PROYECTOS') as any[],
  movimientos: getDemoData('DEMO_MOVIMIENTOS') as any[],
  avances: getDemoData('DEMO_AVANCES') as any[],
  materiales: getDemoData('DEMO_MATERIALES') as any[],
  empleados: getDemoData('DEMO_EMPLEADOS') as any[],
  proveedores: getDemoData('DEMO_PROVEEDORES') as any[],
  ordenes: getDemoData('DEMO_ORDENES') as any[],
  presupuestos: getDemoData('DEMO_PRESUPUESTOS') as any[],
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
  empresaInfo?: { nombre: string; nit: string; telefono: string; email: string; direccion: string; ciudad: string; pais: string; };
}

export const ALLOWED: Record<Rol, View[]> = {
  Administrador: ['dashboard','proyectos','presupuestos','seguimiento','financiero','rrhh','bodega','crm','apu','curvas','baseprecios','reportes','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','visor-bim','predictivo','exportacion','logistica','rendimiento-campo','comercial-fin','admin-sistema','planilla-destajos','impuestos','entradas-almacen','ajustes','hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones'],
  Gerente: ['dashboard','proyectos','presupuestos','seguimiento','financiero','rrhh','bodega','crm','apu','curvas','baseprecios','reportes','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','visor-bim','predictivo','exportacion','logistica','rendimiento-campo','comercial-fin','admin-sistema','planilla-destajos','impuestos','entradas-almacen','ajustes','hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones'],
  Residente: ['dashboard','proyectos','presupuestos','seguimiento','apu','curvas','baseprecios','reportes','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','hitos','riesgos','ajustes','cotizaciones'],
  Compras: ['dashboard','bodega','proyectos','cuentas-pagar','ajustes','cotizaciones'],
  Bodeguero: ['dashboard','bodega','ajustes'],
};

export type LogAuditoria = {
  id: string; usuarioId?: string; usuarioNombre: string;
  accion: string; entidad: string; entidadId?: string;
  valoresAnteriores?: Record<string, unknown>; valoresNuevos?: Record<string, unknown>;
  createdAt: string;
};

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'salazaroliveros@gmail.com';
export const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0>>(c==='x'?0:1)).toString(16));
};
export const mapRol = (rol: string, email?: string): Rol => {
  const validRoles: Rol[] = ['Administrador','Gerente','Residente','Compras','Bodeguero'];
  if (validRoles.includes(rol as Rol)) return rol as Rol;
  if (email === ADMIN_EMAIL) return 'Administrador';
  return 'Residente';
};

const Ctx = createContext<any>(null);
export const useErp = () => {
  const ctx = useContext(Ctx);
  const zState = useErpStore();
  return useMemo(() => ctx ? { ...zState, ...ctx } : zState, [zState, ctx]);
};

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const getInitialView = (): string => {
    if (isDev) return 'dashboard';
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_KEY;
      if (!url || !key) return 'login';
      const hasSession = Object.keys(localStorage).some(k => k.startsWith('sb-') && k.includes('-auth-token'));
      if (hasSession) return 'dashboard';
    } catch {}
    return 'login';
  };

  const [view, setView] = React.useState<string>(getInitialView);
  const [initializing, setInitializing] = React.useState(true);
  const [isOnline, setIsOnline] = React.useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const auth = useAuth();
  const user = auth.user as any;
  const authError = auth.error;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  useEffect(() => { if (auth.loading === false && initializing) setInitializing(false); }, [auth.loading, initializing]);
  useEffect(() => { if (!initializing) return; const t = setTimeout(() => setInitializing(false), 2000); return () => clearTimeout(t); }, [initializing]);

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (auth.user) {
      if (view === 'login') setView('dashboard');
      if (initializing) setInitializing(false);
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        fetchInitialData();
      }
      return;
    }
    if (auth.error) { console.warn('[Store] auth.error:', auth.error); if (initializing) setInitializing(false); }
  }, [auth.user, auth.error, initializing, view]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    useErpStore.setState({
      proyectos: loadWithDemo(BASE_STORAGE_KEY + '_proyectos', proyectoSchema, demoDataMap.proyectos as any),
      movimientos: loadWithDemo(BASE_STORAGE_KEY + '_movimientos', movimientoSchema, demoDataMap.movimientos as any),
      empleados: loadWithDemo(BASE_STORAGE_KEY + '_empleados', empleadoSchema, demoDataMap.empleados as any),
      materiales: loadWithDemo(BASE_STORAGE_KEY + '_materiales', materialSchema, demoDataMap.materiales as any),
      ordenes: loadWithDemo(BASE_STORAGE_KEY + '_ordenes', ordenSchema, demoDataMap.ordenes as any),
      proveedores: loadWithDemo(BASE_STORAGE_KEY + '_proveedores', proveedorSchema, demoDataMap.proveedores as any),
      eventos: loadWithDemo(BASE_STORAGE_KEY + '_eventos', eventoSchema, []),
      presupuestos: loadWithDemo(BASE_STORAGE_KEY + '_presupuestos', presupuestoSchema, demoDataMap.presupuestos as any),
      avances: loadWithDemo(BASE_STORAGE_KEY + '_avances', avanceObraSchema, demoDataMap.avances as any),
      cuentasCobrar: loadWithDemo(BASE_STORAGE_KEY + '_cuentas_cobrar', cuentaCobrarSchema, []),
      cuentasPagar: loadWithDemo(BASE_STORAGE_KEY + '_cuentas_pagar', cuentaPagarSchema, []),
      ordenesCambio: loadWithDemo(BASE_STORAGE_KEY + '_ordenes_cambio', ordenCambioSchema, []),
      hitos: loadWithDemo(BASE_STORAGE_KEY + '_hitos', hitoSchema, []),
      riesgos: loadWithDemo(BASE_STORAGE_KEY + '_riesgos', riesgoSchema, []),
      licitaciones: loadWithDemo(BASE_STORAGE_KEY + '_licitaciones', licitacionSchema, []),
      cotizacionesNegocio: loadWithDemo(BASE_STORAGE_KEY + '_cotizacionesNegocio', cotizacionSchema, []),
      ventasPaquetes: loadWithDemo(BASE_STORAGE_KEY + '_ventasPaquetes', ventaPaqueteSchema, []),
      bitacora: loadWithDemo(BASE_STORAGE_KEY + '_bitacora', bitacoraSchema, []),
      pruebas: loadWithDemo(BASE_STORAGE_KEY + '_pruebas', pruebaSchema, []),
      ncs: loadWithDemo(BASE_STORAGE_KEY + '_no_conformidades', noConformidadSchema, []),
      valesSalida: loadWithDemo(BASE_STORAGE_KEY + '_vales_salida', valeSalidaSchema, []),
      seguimientoEVM: loadWithDemo(BASE_STORAGE_KEY + '_seguimiento_evm', seguimientoSchema, []),
      incidentes: loadWithDemo(BASE_STORAGE_KEY + '_incidentes', incidenteSchema, []),
      publicacionesMuro: loadWithDemo(BASE_STORAGE_KEY + '_publicaciones_muro', muroSchema, []),
      liberaciones: loadWithDemo(BASE_STORAGE_KEY + '_liberaciones', liberacionSchema, []),
      planos: loadWithDemo(BASE_STORAGE_KEY + '_planos', planoSchema, []),
      rfis: loadWithDemo(BASE_STORAGE_KEY + '_rfis', rfiSchema, []),
      submittals: loadWithDemo(BASE_STORAGE_KEY + '_submittals', submittalSchema, []),
      activos: loadWithDemo(BASE_STORAGE_KEY + '_activos', activoSchema, []),
      cuadros: loadWithDemo(BASE_STORAGE_KEY + '_cuadros', cuadroSchema, []),
      pagosProveedor: loadWithDemo(BASE_STORAGE_KEY + '_pagos_proveedor', pagoProveedorSchema, []),
      destajos: loadWithDemo(BASE_STORAGE_KEY + '_destajos', destajoSchema, []),
      recepciones: loadWithDemo(BASE_STORAGE_KEY + '_recepciones', recepcionAlmacenSchema, []),
      mutationQueue: JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as Mutation[],
      notificaciones: JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]') as any[],
      auditLog: JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]') as any[],
      appSettings: (() => {
        try {
          const raw = localStorage.getItem(BASE_STORAGE_KEY + '_settings');
          if (raw) return JSON.parse(raw) as AppSettings;
        } catch {}
        return APP_SETTINGS_DEFAULTS;
      })(),
    });
    if (useErpStore.getState().appSettings.empresaInfo) setEmpresaInfo(useErpStore.getState().appSettings.empresaInfo);
  }, []);

  const syncCooldownRef = useRef(false);
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;

  useEffect(() => {
    const cancel = scheduleHealthCheck(() => ({
      proyectos: useErpStore.getState().proyectos.length,
      movimientos: useErpStore.getState().movimientos.length,
      mutationQueue: useErpStore.getState().mutationQueue.length,
      notificaciones: useErpStore.getState().notificaciones.length,
      isOnline, user: !!user,
    }), 'ErpProvider', 600000);
    return cancel;
  }, [isOnline, user]);

  const forceSync = useMemo(() => {
    return async () => {
      if (syncCooldownRef.current) return;
      const queue = useErpStore.getState().mutationQueue;
      if (queue.length === 0 || !isOnlineRef.current) return;
      syncCooldownRef.current = true;
      useErpStore.setState({ syncMessage: `Sincronizando ${queue.length} cambios...` });
      setTimeout(() => { syncCooldownRef.current = false; useErpStore.setState({ syncMessage: '' }); }, 1000);
    };
  }, []);

  useEffect(() => { if (isOnlineRef.current && useErpStore.getState().mutationQueue.length > 0) forceSync(); }, [isOnline, forceSync]);

  useEffect(() => {
    const STORAGE_KEY = 'wm_erp_data';
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useErpStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const s = useErpStore.getState();
          const map: Record<string, any> = {
            proyectos: s.proyectos, movimientos: s.movimientos, empleados: s.empleados, materiales: s.materiales,
            ordenes: s.ordenes, proveedores: s.proveedores, eventos: s.eventos, presupuestos: s.presupuestos,
            avances: s.avances, cuentasCobrar: s.cuentasCobrar, cuentasPagar: s.cuentasPagar,
            ordenesCambio: s.ordenesCambio, hitos: s.hitos, riesgos: s.riesgos, licitaciones: s.licitaciones,
            cotizacionesNegocio: s.cotizacionesNegocio, ventasPaquetes: s.ventasPaquetes, bitacora: s.bitacora,
            pruebas: s.pruebas, no_conformidades: s.ncs, vales_salida: s.valesSalida,
            seguimiento_evm: s.seguimientoEVM, incidentes: s.incidentes, publicaciones_muro: s.publicacionesMuro,
            liberaciones: s.liberaciones, planos: s.planos, rfis: s.rfis, submittals: s.submittals,
            activos: s.activos, cuadros: s.cuadros, pagos_proveedor: s.pagosProveedor,
            destajos: s.destajos, recepciones: s.recepciones,
          };
          const quotaCritical = isStorageQuotaCritical();
          Object.entries(map).forEach(([k, v]) => {
            const value = compressData(v);
            safeSetItem(`${STORAGE_KEY}_${k}`, value, `${STORAGE_KEY}_${k}`);
          });
          safeSetItem(`${STORAGE_KEY}_settings`, JSON.stringify(s.appSettings));
          safeSetItem('wm_erp_queue', compressData(s.mutationQueue));
          safeSetItem(`${STORAGE_KEY}_notificaciones`, compressData(s.notificaciones));
          safeSetItem(`${STORAGE_KEY}_audit_log`, compressData(s.auditLog));
          if (quotaCritical) safeLogger.warn('[Storage] Cuota de localStorage casi llena — usando compresión');
        } catch (e) { safeLogger.warn('[Storage] Error al persistir:', e); }
      }, 500);
    });
    return () => { unsub(); clearTimeout(timer); };
  }, []);

  const allowedViews = useMemo(() => {
    const rt = { Administrador: 'Administrador', Gerente: 'Gerente', Residente: 'Residente', Compras: 'Compras', Bodeguero: 'Bodeguero' } as Record<string, Rol>;
    return user ? (ALLOWED[rt[(user.rol as string) || 'Residente']] || ALLOWED['Residente']) : [];
  }, [user]);

  const ctxValue = useMemo<any>(() => ({
    view, setView, user, initializing, isOnline, authError,
    signIn: (e: string, p: string) => auth.signIn(e, p),
    signUp: (e: string, p: string, n: string, r: Rol) => auth.signUp(e, p, n, r),
    signInWithGoogle: () => auth.signInWithGoogle(),
    logout: () => auth.logout(),
    allowedViews,
  }), [view, user, initializing, isOnline, authError, allowedViews, auth]);

  return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>;
};
