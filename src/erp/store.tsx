import React, { createContext, useContext, useEffect, useRef, useMemo, useState } from 'react';
import { z } from 'zod';
import { scheduleHealthCheck } from '@/lib/store-health';
import { useErpStore, fetchInitialData } from './zustandStore';
import {
  proyectoSchema, movimientoSchema, cuentaCobrarSchema, cuentaPagarSchema, ordenCambioSchema,
  presupuestoSchema, cotizacionSchema, empleadoSchema, incidenteSchema, materialSchema,
  ordenSchema, proveedorSchema, eventoCalendarioSchema, eventoSchema, bitacoraEntrySchema,
  bitacoraSchema, seguimientoSchema, avanceObraSchema, hitoSchema, riesgoSchema, muroSchema,
  notificacionSchema, liberacionSchema, pruebaSchema, noConformidadSchema, activoSchema,
  licitacionSchema, cuadroSchema, pagoProveedorSchema, planoSchema, rfiSchema, submittalSchema,
  destajoSchema, recepcionAlmacenSchema, valeSalidaSchema, centroCostoSchema,
} from './store/schemas';
import { setEmpresaInfo, APP_SETTINGS_DEFAULTS, compressData, decompressData, safeSetItem, isStorageQuotaCritical, toSnake } from './utils';
import { hasSupabase, assertSupabase } from '@/lib/supabase';
import { safeLogger } from '@/lib/safeLogger';
import { useAuth } from '@/hooks/useAuth';
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

function loadFromStorage<T>(key: string, schema: z.ZodTypeAny): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const decompressed = decompressData(raw);
    if (decompressed === null) { safeLogger.warn(`[Storage] Decompress fail: ${key}`); return []; }
    const result = z.array(schema).safeParse(decompressed);
    if (result.success) return result.data;
  } catch { safeLogger.warn(`[Storage] Corrupto: ${key}`); }
  return [];
}

export type View = 'login' | 'dashboard' | 'proyectos' | 'presupuestos' | 'seguimiento' | 'financiero' | 'rrhh' | 'bodega' | 'crm' | 'apu' | 'curvas' | 'baseprecios' | 'reportes' | 'muro' | 'ordenes-cambio' | 'notificaciones' | 'sso-calidad' | 'documentos' | 'visor-bim' | 'predictivo' | 'exportacion' | 'logistica' | 'rendimiento-campo' | 'comercial-fin' | 'admin-sistema' | 'planilla-destajos' | 'impuestos' | 'entradas-almacen' | 'ajustes' | 'hitos' | 'riesgos' | 'cuentas-cobrar' | 'cuentas-pagar' | 'cotizaciones';
export type UIMode = 'shadcn' | 'antd';
export type AppThemeMode = 'light' | 'dark' | 'high-contrast' | 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism';
export type Reporte = 'cubicacion' | 'rendimientos' | 'ejecutivo';

export const ALL_VIEWS: View[] = [
  'dashboard','proyectos','presupuestos','seguimiento','financiero','rrhh','bodega','crm','apu','curvas','baseprecios','reportes','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','visor-bim','predictivo','exportacion','logistica','rendimiento-campo','comercial-fin','admin-sistema','planilla-destajos','impuestos','entradas-almacen','ajustes','hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones'
];

export const clearAllData = () => {
  if (typeof window !== 'undefined' && useErpStore.getState().clearAllData) {
    useErpStore.getState().clearAllData();
    window.location.reload();
  }
};

export interface AppSettings {
  uiMode: UIMode; appTheme: AppThemeMode; primaryColor: string; language: 'es' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'; currency: 'GTQ' | 'USD';
  sidebarCollapsed: boolean; animationsEnabled: boolean; compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  empresaInfo?: { nombre: string; nit: string; telefono: string; email: string; direccion: string; ciudad: string; pais: string; };
}

export type LogAuditoria = {
  id: string; usuarioId?: string; usuarioNombre: string;
  accion: string; entidad: string; entidadId?: string;
  valoresAnteriores?: Record<string, unknown>; valoresNuevos?: Record<string, unknown>;
  createdAt: string;
};

export const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0>>(c==='x'?0:1)).toString(16));
};

const Ctx = createContext<any>(null);
export const useErp = () => {
  const ctx = useContext(Ctx);
  const zState = useErpStore();
  return useMemo(() => ctx ? { ...zState, ...ctx } : zState, [zState, ctx]);
};

const MUTATION_TABLE_MAP: Record<string, string> = {
  addProyecto:'erp_proyectos',updateProyecto:'erp_proyectos',deleteProyecto:'erp_proyectos',clearProyectos:'erp_proyectos',
  addMovimiento:'erp_movimientos',updateMovimiento:'erp_movimientos',deleteMovimiento:'erp_movimientos',
  addEmpleado:'erp_empleados',updateEmpleado:'erp_empleados',deleteEmpleado:'erp_empleados',
  addMaterial:'erp_materiales',updateMaterial:'erp_materiales',deleteMaterial:'erp_materiales',
  addOrden:'erp_ordenes_compra',updateOrden:'erp_ordenes_compra',deleteOrden:'erp_ordenes_compra',
  addProveedor:'erp_proveedores',updateProveedor:'erp_proveedores',deleteProveedor:'erp_proveedores',
  addEvento:'erp_eventos_calendario',updateEvento:'erp_eventos_calendario',deleteEvento:'erp_eventos_calendario',
  addBitacora:'erp_bitacora',updateBitacora:'erp_bitacora',deleteBitacora:'erp_bitacora',
  addPresupuesto:'erp_presupuestos',updatePresupuesto:'erp_presupuestos',deletePresupuesto:'erp_presupuestos',
  addLicitacion:'erp_licitaciones',updateLicitacion:'erp_licitaciones',deleteLicitacion:'erp_licitaciones',
  addCotizacion:'erp_cotizaciones_negocio',updateCotizacion:'erp_cotizaciones_negocio',deleteCotizacion:'erp_cotizaciones_negocio',
  addVentaPaquete:'ventas_paquetes',
  addAvance:'erp_avances',deleteAvance:'erp_avances',
  addCuentaCobrar:'erp_cuentas_cobrar',updateCuentaCobrar:'erp_cuentas_cobrar',deleteCuentaCobrar:'erp_cuentas_cobrar',
  addCuentaPagar:'erp_cuentas_pagar',updateCuentaPagar:'erp_cuentas_pagar',deleteCuentaPagar:'erp_cuentas_pagar',
  addOrdenCambio:'erp_ordenes_cambio',updateOrdenCambio:'erp_ordenes_cambio',deleteOrdenCambio:'erp_ordenes_cambio',
  addHito:'erp_hitos',updateHito:'erp_hitos',deleteHito:'erp_hitos',
  addRiesgo:'erp_riesgos',updateRiesgo:'erp_riesgos',deleteRiesgo:'erp_riesgos',
  addPlano:'erp_planos',updatePlano:'erp_planos',deletePlano:'erp_planos',
  addRfi:'erp_rfis',updateRfi:'erp_rfis',deleteRfi:'erp_rfis',
  addSubmittal:'erp_submittals',updateSubmittal:'erp_submittals',deleteSubmittal:'erp_submittals',
  addActivo:'erp_activos',updateActivo:'erp_activos',deleteActivo:'erp_activos',
  addCuadro:'erp_cuadros',updateCuadro:'erp_cuadros',deleteCuadro:'erp_cuadros',
  addPagoProveedor:'erp_pagos_proveedor',updatePagoProveedor:'erp_pagos_proveedor',deletePagoProveedor:'erp_pagos_proveedor',
  addIncidente:'erp_incidentes',updateIncidente:'erp_incidentes',deleteIncidente:'erp_incidentes',
  addDestajo:'destajos',updateDestajo:'destajos',deleteDestajo:'destajos',
  addRecepcion:'recepciones_almacen',deleteRecepcion:'recepciones_almacen',
  addValeSalida:'erp_vales_salida',deleteValeSalida:'erp_vales_salida',
  addPublicacionMuro:'erp_publicaciones_muro',
  addComentarioMuro:'erp_publicaciones_muro',
  likePublicacionMuro:'erp_publicaciones_muro',
  addPrueba:'erp_pruebas',updatePrueba:'erp_pruebas',deletePrueba:'erp_pruebas',
  addNC:'erp_no_conformidades',updateNC:'erp_no_conformidades',deleteNC:'erp_no_conformidades',
  addLiberacion:'erp_liberaciones_partida',updateLiberacion:'erp_liberaciones_partida',deleteLiberacion:'erp_liberaciones_partida',
  addNotificacion:'erp_notificaciones',markNotificacionLeida:'erp_notificaciones',deleteNotificacion:'erp_notificaciones',
  addSeguimiento:'erp_seguimiento',updateSeguimiento:'erp_seguimiento',deleteSeguimiento:'erp_seguimiento',
};

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<string>('dashboard');
  const [initializing, setInitializing] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const { user: authUser, signInWithGoogle: realSignInWithGoogle, logout: realLogout, loading: authLoading } = useAuth();

   const user = useMemo(() => {
     if (authUser) {
       const avatar = (authUser as any)?.avatar || (authUser as any)?.picture || null;
       if (avatar && typeof window !== 'undefined') {
         try { localStorage.setItem('wm_google_avatar', avatar); } catch {}
       }
       return {
         id: authUser.id,
         email: authUser.email,
         nombre: authUser.nombre,
         rol: authUser.rol,
         avatar,
       };
     }
     return { id: 'local', email: 'local@construsmart', nombre: 'Usuario Local', rol: 'Administrador' as Rol, avatar: null };
   }, [authUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  useEffect(() => { if (initializing) setInitializing(false); }, [initializing]);

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (initializing) setInitializing(false);
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchInitialData();
    }
  }, [initializing]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    useErpStore.setState({
      proyectos: loadFromStorage(BASE_STORAGE_KEY + '_proyectos', proyectoSchema),
      movimientos: loadFromStorage(BASE_STORAGE_KEY + '_movimientos', movimientoSchema),
      empleados: loadFromStorage(BASE_STORAGE_KEY + '_empleados', empleadoSchema),
      materiales: loadFromStorage(BASE_STORAGE_KEY + '_materiales', materialSchema),
      ordenes: loadFromStorage(BASE_STORAGE_KEY + '_ordenes', ordenSchema),
      proveedores: loadFromStorage(BASE_STORAGE_KEY + '_proveedores', proveedorSchema),
      eventos: loadFromStorage(BASE_STORAGE_KEY + '_eventos', eventoSchema),
      presupuestos: loadFromStorage(BASE_STORAGE_KEY + '_presupuestos', presupuestoSchema),
      avances: loadFromStorage(BASE_STORAGE_KEY + '_avances', avanceObraSchema),
      cuentasCobrar: loadFromStorage(BASE_STORAGE_KEY + '_cuentas_cobrar', cuentaCobrarSchema),
      cuentasPagar: loadFromStorage(BASE_STORAGE_KEY + '_cuentas_pagar', cuentaPagarSchema),
      ordenesCambio: loadFromStorage(BASE_STORAGE_KEY + '_ordenes_cambio', ordenCambioSchema),
      hitos: loadFromStorage(BASE_STORAGE_KEY + '_hitos', hitoSchema),
      riesgos: loadFromStorage(BASE_STORAGE_KEY + '_riesgos', riesgoSchema),
      licitaciones: loadFromStorage(BASE_STORAGE_KEY + '_licitaciones', licitacionSchema),
      cotizacionesNegocio: loadFromStorage(BASE_STORAGE_KEY + '_cotizacionesNegocio', cotizacionSchema),

      bitacora: loadFromStorage(BASE_STORAGE_KEY + '_bitacora', bitacoraSchema),
      pruebas: loadFromStorage(BASE_STORAGE_KEY + '_pruebas', pruebaSchema),
      ncs: loadFromStorage(BASE_STORAGE_KEY + '_no_conformidades', noConformidadSchema),
      valesSalida: loadFromStorage(BASE_STORAGE_KEY + '_vales_salida', valeSalidaSchema),
      seguimientoEVM: loadFromStorage(BASE_STORAGE_KEY + '_seguimiento_evm', seguimientoSchema),
      incidentes: loadFromStorage(BASE_STORAGE_KEY + '_incidentes', incidenteSchema),
      publicacionesMuro: loadFromStorage(BASE_STORAGE_KEY + '_publicaciones_muro', muroSchema),
      liberaciones: loadFromStorage(BASE_STORAGE_KEY + '_liberaciones', liberacionSchema),
      planos: loadFromStorage(BASE_STORAGE_KEY + '_planos', planoSchema),
      rfis: loadFromStorage(BASE_STORAGE_KEY + '_rfis', rfiSchema),
      submittals: loadFromStorage(BASE_STORAGE_KEY + '_submittals', submittalSchema),
      activos: loadFromStorage(BASE_STORAGE_KEY + '_activos', activoSchema),
      cuadros: loadFromStorage(BASE_STORAGE_KEY + '_cuadros', cuadroSchema),
      pagosProveedor: loadFromStorage(BASE_STORAGE_KEY + '_pagos_proveedor', pagoProveedorSchema),
      destajos: loadFromStorage(BASE_STORAGE_KEY + '_destajos', destajoSchema),
      recepciones: loadFromStorage(BASE_STORAGE_KEY + '_recepciones', recepcionAlmacenSchema),
      centrosCosto: loadFromStorage(BASE_STORAGE_KEY + '_centros_costo', centroCostoSchema),
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

  const keepAliveRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!isOnline) return;
    const tick = () => {
      const status = useErpStore.getState().syncStatus;
      if (status === 'idle' || status === 'error') fetchInitialData(1);
      keepAliveRef.current = setTimeout(tick, 600000);
    };
    keepAliveRef.current = setTimeout(tick, 600000);
    const onVis = () => { if (document.visibilityState === 'visible') fetchInitialData(1); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearTimeout(keepAliveRef.current); document.removeEventListener('visibilitychange', onVis); };
  }, [isOnline]);

  const forceSync = useMemo(() => {
    return async () => {
      if (syncCooldownRef.current) return;
      const queue = useErpStore.getState().mutationQueue;
      if (queue.length === 0 || !isOnlineRef.current || !hasSupabase) return;

      syncCooldownRef.current = true;
      useErpStore.setState({ syncMessage: `Sincronizando ${queue.length} cambios...`, syncStatus: queue.length > 0 ? 'queued' : 'loading', syncError: undefined });

      const supabase = assertSupabase();
      const processed: string[] = [];
      const failed: Mutation[] = [];

      for (const mutation of queue) {
        try {
          const table = MUTATION_TABLE_MAP[mutation.type];
          if (!table) { processed.push(mutation.id); continue; }

          const rawPayload = sanitizarObjeto(mutation.payload);
          const payload = toSnake(rawPayload);

          if (mutation.type === 'clearProyectos') {
            const ids = (payload.ids as string[] | undefined) || [];
            if (ids.length) {
              const { error } = await supabase.from(table).delete().in('id', ids);
              if (error) throw error;
            }
          } else if (mutation.type.startsWith('add')) {
            const { error } = await supabase.from(table).insert(payload);
            if (error) throw error;
          } else if (mutation.type.startsWith('update') || mutation.type.startsWith('mark')) {
            const { id, ...data } = payload;
            if (id) {
              const { error } = await supabase.from(table).update(data).eq('id', id);
              if (error) throw error;
            }
          } else if (mutation.type.startsWith('delete')) {
            const { id } = payload;
            if (id) {
              const { error } = await supabase.from(table).delete().eq('id', id);
              if (error) throw error;
            }
          } else if (mutation.type === 'addComentarioMuro') {
            const { publicacionId, comentario } = payload;
            const { error } = await supabase.rpc('append_comentario_muro', { publicacion_id: publicacionId, comentario });
            if (error) throw error;
          } else if (mutation.type === 'likePublicacionMuro') {
            const { id } = payload;
            const { error } = await supabase.rpc('increment_likes_muro', { row_id: id });
            if (error) throw error;
          }

          processed.push(mutation.id);
        } catch (err) {
          const error = err instanceof Error ? err.message : String(err);
          safeLogger.warn(`[forceSync] Error en ${mutation.type}:`, err);
          if (mutation.retryCount >= 3) {
            processed.push(mutation.id);
          } else {
            failed.push({ ...mutation, retryCount: mutation.retryCount + 1 });
          }
        }
      }

      const remaining = queue.filter(m => !processed.includes(m.id));
      failed.forEach(f => { if (!remaining.find(r => r.id === f.id)) remaining.push(f); });
      useErpStore.getState().setMutationQueue(remaining);

      syncCooldownRef.current = false;

      if (processed.length > 0 || failed.length > 0) {
        const msg = processed.length > 0
          ? `${processed.length} cambios sincronizados en ${Object.keys(MUTATION_TABLE_MAP).length} tablas.`
          : '';
        const errMsg = failed.length > 0 ? ` ${failed.length} fallaron` : '';
        useErpStore.setState({ syncMessage: msg + errMsg, syncStatus: failed.length > 0 ? 'error' : 'synced', syncError: failed.length > 0 ? 'Algunos cambios fallaron' : undefined, lastSyncedAt: new Date().toISOString() });
        if (processed.length > 0) await fetchInitialData();
        if (msg) setTimeout(() => useErpStore.setState({ syncMessage: '' }), 3000);
      }
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
            cotizacionesNegocio: s.cotizacionesNegocio, bitacora: s.bitacora,
            pruebas: s.pruebas, no_conformidades: s.ncs, vales_salida: s.valesSalida,
            seguimiento_evm: s.seguimientoEVM, incidentes: s.incidentes, publicacionesMuro: s.publicacionesMuro,
            liberaciones: s.liberaciones, planos: s.planos, rfis: s.rfis, submittals: s.submittals,
            activos: s.activos, cuadros: s.cuadros, pagos_proveedor: s.pagosProveedor,
            destajos: s.destajos, recepciones: s.recepciones, centrosCosto: s.centrosCosto,
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

  const allowedViews = useMemo(() => ALL_VIEWS, []);

  const notificacionesNoLeidas = useErpStore(s => s.notificaciones.filter(n => !n.leida).length);

  const ctxValue = useMemo<any>(() => ({
    view, setView, user, initializing, isOnline, notificacionesNoLeidas,
    signInWithGoogle: realSignInWithGoogle,
    logout: realLogout,
    allowedViews, forceSync,
  }), [view, user, initializing, isOnline, notificacionesNoLeidas, realSignInWithGoogle, realLogout, forceSync]);

  return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>;
};
