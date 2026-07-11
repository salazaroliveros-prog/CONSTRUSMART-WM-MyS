import React, { createContext, useContext, useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { z } from 'zod';
import { scheduleHealthCheck } from '@/lib/store-health';
import { useErpStore, fetchInitialData } from './zustandStore';
import { TABLE_MAP as STORE_KEY_MAP } from './constants/table-mappings';
import {
   proyectoSchema, movimientoSchema, cuentaCobrarSchema, cuentaPagarSchema, ordenCambioSchema, ventaPaqueteSchema,
   presupuestoSchema, cotizacionSchema, empleadoSchema, incidenteSchema, materialSchema,
   ordenSchema, proveedorSchema, eventoSchema,
   bitacoraSchema, seguimientoSchema, avanceObraSchema, hitoSchema, riesgoSchema, muroSchema,
   notificacionSchema, liberacionSchema, pruebaSchema, noConformidadSchema, activoSchema,
   licitacionSchema, cuadroSchema, pagoProveedorSchema, planoSchema, rfiSchema, submittalSchema,
   destajoSchema, recepcionAlmacenSchema, valeSalidaSchema, centroCostoSchema, plantillaSchema, insumosBaseSchema,
    auditLogSchema, appSettingsSchema, proyectoWeatherSchema, errorLogSchema, calculoProyectoSchema,
    reglaFactorSchema, normativaDepartamentalSchema, escalaProduccionSchema, estacionalidadSchema,
    historialAplicacionReglaSchema, projectProfitabilitySchema, clientProfitabilitySchema, resourceEfficiencySchema, profitabilityTrendSchema,
    ajusteEstacionalActividadSchema, aplicacionEscalaSchema, cumplimientoNormativoSchema,
} from './store/schemas';
import { setEmpresaInfo, APP_SETTINGS_DEFAULTS, decompressData, compressDataAsync, safeSetItem, isStorageQuotaCritical, toSnake, toCamel } from './utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hasSupabase, assertSupabase, supabase } from '@/lib/supabase';
import { safeLogger } from '@/lib/safeLogger';
import { sanitizarObjeto, getViewsByRole } from '@/lib/security';
import { useAuth } from '@/hooks/useAuth';
import { encryptionManager, migrateSecureStorage } from '@/lib/encryption';
import { logErrorFromException } from '@/lib/error-logger';
const BASE_STORAGE_KEY = 'wm_erp_data';
const QUEUE_KEY = 'wm_erp_queue';
const NOTIF_KEY = BASE_STORAGE_KEY + '_notificaciones';
const AUDIT_KEY = BASE_STORAGE_KEY + '_audit_log';
const PLANTILLA_KEY = BASE_STORAGE_KEY + '_plantillas';
const WEATHER_KEY = BASE_STORAGE_KEY + '_weather';
const ERROR_LOG_KEY = BASE_STORAGE_KEY + '_error_logs';
const REGLAS_KEY = BASE_STORAGE_KEY + '_reglas_factores';
const NORMATIVAS_KEY = BASE_STORAGE_KEY + '_normativas';
const ESCALAS_KEY = BASE_STORAGE_KEY + '_escalas';
const ESTACIONALIDAD_KEY = BASE_STORAGE_KEY + '_estacionalidad';
const HISTORIAL_REGLAS_KEY = BASE_STORAGE_KEY + '_historial_reglas';
const PROFITABILITY_KEY = BASE_STORAGE_KEY + '_profitability';
const AJUSTES_ESTACIONALES_KEY = BASE_STORAGE_KEY + '_ajustes_estacionales';
const APLICACION_ESCALAS_KEY = BASE_STORAGE_KEY + '_aplicacion_escalas';
const CUMPLIMIENTO_NORMATIVO_KEY = BASE_STORAGE_KEY + '_cumplimiento_normativo';
const REORDERING_KEY = BASE_STORAGE_KEY + '_reordering';

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

function loadObjectFromStorage<T>(key: string, schema: z.ZodTypeAny, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const decompressed = decompressData(raw);
    if (decompressed === null) { safeLogger.warn(`[Storage] Decompress fail: ${key}`); return fallback; }
    const result = schema.safeParse(decompressed);
    if (result.success) return result.data;
  } catch { safeLogger.warn(`[Storage] Corrupto: ${key}`); }
  return fallback;
}

export type View = 'login' | 'dashboard' | 'proyectos' | 'presupuestos' | 'seguimiento' | 'financiero' | 'rrhh' | 'bodega' | 'crm' | 'apu' | 'baseprecios' | 'muro' | 'ordenes-cambio' | 'notificaciones' | 'sso-calidad' | 'documentos' | 'visor-bim' | 'predictivo' | 'exportacion' | 'logistica' | 'rendimiento-campo' | 'comercial-fin' | 'admin-sistema' | 'planilla-destajos' | 'impuestos' | 'entradas-almacen' | 'ajustes' | 'hitos' | 'riesgos' | 'cuentas-cobrar' | 'cuentas-pagar' | 'cotizaciones' | 'plantillas' | 'proveedor-analytics' | 'error-log' | 'activos' | 'cuadros' | 'profitability' | 'weather';
export type UIMode = 'shadcn' | 'antd';
export type AppThemeMode = 'light' | 'dark' | 'high-contrast' | 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism';

export const ALL_VIEWS: View[] = [
  'dashboard','proyectos','presupuestos','seguimiento','financiero','rrhh','bodega','crm','apu','baseprecios','muro','ordenes-cambio','notificaciones','sso-calidad','documentos','visor-bim','predictivo','exportacion','logistica','rendimiento-campo','comercial-fin','admin-sistema','planilla-destajos','impuestos','entradas-almacen','ajustes','hitos','riesgos','cuentas-cobrar','cuentas-pagar','cotizaciones','plantillas','proveedor-analytics','error-log','activos','cuadros','profitability','weather'
];

export const clearAllData = () => {
  if (typeof window !== 'undefined' && useErpStore.getState().clearAllData) {
    useErpStore.getState().clearAllData();
    window.location.reload();
  }
};

import type { AppSettings, Mutation } from './types';


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

interface ErpContextValue {
  view: string;
  setView: (v: string) => void;
  user: Record<string, any> | null;
  initializing: boolean;
  isOnline: boolean;
  notificacionesNoLeidas: number;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  allowedViews: readonly string[];
  forceSync: () => Promise<void>;
  currentProjectId: string | null;
  setCurrentProjectId: (v: string | null) => void;
  currentProject: Proyecto | null;
}

const Ctx = createContext<ErpContextValue>(null!);
export const useErp = () => {
  const ctx = useContext(Ctx);
  const zState = useErpStore();
  return useMemo(() => ({ ...zState, ...ctx }), [zState, ctx]);
};

export const useCurrentProject = () => {
  const { currentProjectId, setCurrentProjectId, currentProject } = useErp();
  return useMemo(() => ({
    currentProjectId,
    setCurrentProjectId,
    currentProject,
  }), [currentProjectId, setCurrentProjectId, currentProject]);
};

// Store key mapping: Supabase table name → zustand store key
const APP_ONLY_FIELDS = new Set(['currentProjectId']);

function stripAppOnlyFields<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of APP_ONLY_FIELDS) {
    delete result[key as keyof T];
  }
  return result;
}

const MUTATION_TABLE_MAP: Record<string, string> = {
  addProyecto:'erp_proyectos',updateProyecto:'erp_proyectos',deleteProyecto:'erp_proyectos',
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
  addVentaPaquete:'erp_ventas_paquetes',updateVentaPaquete:'erp_ventas_paquetes',deleteVentaPaquete:'erp_ventas_paquetes',
  addAvance:'erp_avances',updateAvance:'erp_avances',deleteAvance:'erp_avances',
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
  addDestajo:'erp_destajos',updateDestajo:'erp_destajos',deleteDestajo:'erp_destajos',
  addInsumoBase:'erp_insumos_base',updateInsumoBase:'erp_insumos_base',deleteInsumoBase:'erp_insumos_base',
  addCalculoProyecto:'erp_calculos_proyecto',updateCalculoProyecto:'erp_calculos_proyecto',deleteCalculoProyecto:'erp_calculos_proyecto',
  addRecepcion:'erp_recepciones',updateRecepcion:'erp_recepciones',deleteRecepcion:'erp_recepciones',
  addValeSalida:'erp_vales_salida',updateValeSalida:'erp_vales_salida',deleteValeSalida:'erp_vales_salida',
  addComentarioMuro:'erp_muro',
  likePublicacionMuro:'erp_muro',
  addPrueba:'erp_pruebas_laboratorio',updatePrueba:'erp_pruebas_laboratorio',deletePrueba:'erp_pruebas_laboratorio',
  addNC:'erp_no_conformidades',updateNC:'erp_no_conformidades',deleteNC:'erp_no_conformidades',
  addLiberacion:'erp_liberaciones_partida',updateLiberacion:'erp_liberaciones_partida',deleteLiberacion:'erp_liberaciones_partida',
  addNotificacion:'erp_notificaciones',updateNotificacion:'erp_notificaciones',markNotificacionLeida:'erp_notificaciones',deleteNotificacion:'erp_notificaciones',
  addSeguimiento:'erp_seguimiento',updateSeguimiento:'erp_seguimiento',deleteSeguimiento:'erp_seguimiento',
  addPlantilla:'erp_plantillas_proyectos',updatePlantilla:'erp_plantillas_proyectos',deletePlantilla:'erp_plantillas_proyectos',clonarPlantilla:'erp_plantillas_proyectos',exportarPlantilla:'erp_plantillas_proyectos',importarPlantilla:'erp_plantillas_proyectos',sugerirPlantillas:'erp_plantillas_proyectos',crearNuevaVersionPlantilla:'erp_plantillas_proyectos',restaurarVersionPlantilla:'erp_plantillas_proyectos',toggleFavoritoPlantilla:'erp_plantillas_proyectos',
  addErrorLog:'erp_error_log',addError:'erp_error_log',resolveError:'erp_error_log',deleteError:'erp_error_log',cleanupOldErrors:'erp_error_log',
  addCentroCosto:'erp_centros_costo',updateCentroCosto:'erp_centros_costo',deleteCentroCosto:'erp_centros_costo',
  addReglaFactor:'erp_reglas_factores',updateReglaFactor:'erp_reglas_factores',deleteReglaFactor:'erp_reglas_factores',
  addNormativaDepartamental:'erp_normativa_departamental',updateNormativaDepartamental:'erp_normativa_departamental',deleteNormativaDepartamental:'erp_normativa_departamental',registrarCumplimientoNormativo:'erp_cumplimiento_normativo',
  addEscalaProduccion:'erp_escalas_produccion',updateEscalaProduccion:'erp_escalas_produccion',deleteEscalaProduccion:'erp_escalas_produccion',registrarAplicacionEscala:'erp_aplicacion_escalas',
addEstacionalidad:'erp_estacionalidad',updateEstacionalidad:'erp_estacionalidad',deleteEstacionalidad:'erp_estacionalidad',
   addAjusteEstacionalActividad:'erp_ajustes_estacionales_actividad',updateAjusteEstacionalActividad:'erp_ajustes_estacionales_actividad',deleteAjusteEstacionalActividad:'erp_ajustes_estacionales_actividad',
   validarCalculo:'erp_calculos_proyecto',guardarAlertasCalculo:'erp_calculos_proyecto',registrarAplicacionRegla:'erp_historial_aplicacion_reglas',
   setReglasFactores:'erp_reglas_factores',setNormativasDepartamentales:'erp_normativa_departamental',setEscalasProduccion:'erp_escalas_produccion',setEstacionalidad:'erp_estacionalidad',
};

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<string>('dashboard');
  const [initializing, setInitializing] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const { user: authUser, signInWithGoogle: realSignInWithGoogle, signOut: realLogout, loading: authLoading } = useAuth();
  const handleLogout = useCallback(async () => {
    await realLogout();
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('wm_erp_data') || k === 'zustand_erp_store' || k === 'wm_photo' || k === 'wm_google_avatar' || k.startsWith('sb-'));
      keys.forEach(k => localStorage.removeItem(k));
    } catch {}
    window.location.reload();
  }, [realLogout]);

   const user = useMemo(() => {
     if (authUser) {
       const avatar = authUser.avatar || null;
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
     return null;
   }, [authUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  useEffect(() => {
    if (!authLoading) {
      setInitializing(false);
    }
  }, [authLoading]);

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (authUser && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchInitialData();
    }
  }, [authUser]);

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!authUser || initializedRef.current) return;
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
calculosProyecto: loadFromStorage(BASE_STORAGE_KEY + '_calculos_proyecto', calculoProyectoSchema),
       ventasPaquetes: loadFromStorage(BASE_STORAGE_KEY + '_ventas_paquetes', ventaPaqueteSchema),
       recepciones: loadFromStorage(BASE_STORAGE_KEY + '_recepciones', recepcionAlmacenSchema),
       centrosCosto: loadFromStorage(BASE_STORAGE_KEY + '_centros_costo', centroCostoSchema),
       plantillas: loadFromStorage(PLANTILLA_KEY, plantillaSchema),
       insumosBase: loadFromStorage(BASE_STORAGE_KEY + '_insumos_base', insumosBaseSchema),
       proyectoWeather: loadFromStorage(WEATHER_KEY, proyectoWeatherSchema),
       errorLogs: loadFromStorage(ERROR_LOG_KEY, errorLogSchema),
       reglasFactores: loadFromStorage(REGLAS_KEY, reglaFactorSchema),
       normativasDepartamentales: loadFromStorage(NORMATIVAS_KEY, normativaDepartamentalSchema),
       escalasProduccion: loadFromStorage(ESCALAS_KEY, escalaProduccionSchema),
       estacionalidad: loadFromStorage(ESTACIONALIDAD_KEY, estacionalidadSchema),
        historialReglas: loadFromStorage(HISTORIAL_REGLAS_KEY, historialAplicacionReglaSchema),
        ajustesEstacionalesActividad: loadFromStorage(AJUSTES_ESTACIONALES_KEY, ajusteEstacionalActividadSchema),
        aplicacionEscalas: loadFromStorage(APLICACION_ESCALAS_KEY, aplicacionEscalaSchema),
        cumplimientoNormativo: loadFromStorage(CUMPLIMIENTO_NORMATIVO_KEY, cumplimientoNormativoSchema),
        projectProfitabilities: loadFromStorage(PROFITABILITY_KEY + '_projects', projectProfitabilitySchema),
       clientProfitabilities: loadFromStorage(PROFITABILITY_KEY + '_clients', clientProfitabilitySchema),
       resourceEfficiencies: loadFromStorage(PROFITABILITY_KEY + '_resources', resourceEfficiencySchema),
       profitabilityTrends: loadFromStorage(PROFITABILITY_KEY + '_trends', profitabilityTrendSchema),
      mutationQueue: (() => { try { const r = localStorage.getItem(QUEUE_KEY); if (!r) return []; const d = decompressData(r); return Array.isArray(d) ? d as Mutation[] : []; } catch { return []; } })(),
      notificaciones: loadFromStorage(NOTIF_KEY, notificacionSchema),
      auditLog: loadFromStorage(AUDIT_KEY, auditLogSchema),
      appSettings: loadObjectFromStorage(BASE_STORAGE_KEY + '_settings', appSettingsSchema, APP_SETTINGS_DEFAULTS),
    });
    if (useErpStore.getState().appSettings.empresaInfo) setEmpresaInfo(useErpStore.getState().appSettings.empresaInfo);

    migrateSecureStorage(user?.id).catch(err => safeLogger.warn('[Encryption] Migration error:', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

const tokenBucketRef = useRef({ tokens: 5, lastRefill: Date.now(), maxTokens: 10, refillRate: 5 });
const isOnlineRef = useRef(isOnline);
const supabaseSubscriptionsRef = useRef(false);
isOnlineRef.current = isOnline;

function checkTokenBucket(): boolean {
  const bucket = tokenBucketRef.current;
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsed * bucket.refillRate);
  bucket.lastRefill = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

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

const syncInProgressRef = useRef(false);
const forceSync = useMemo(() => {
        return async () => {
          if (syncInProgressRef.current) return;
          if (!checkTokenBucket()) return;
          const queue = useErpStore.getState().mutationQueue;
          
          if (queue.length === 0) return;
          if (!isOnlineRef.current) {
            useErpStore.setState({ syncStatus: 'queued' });
            return;
          }
          if (!hasSupabase) {
            useErpStore.setState({ syncStatus: 'queued' });
            return;
          }

          syncInProgressRef.current = true;
          let client: SupabaseClient;
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            client = assertSupabase();
          } else {
            useErpStore.setState({ syncMessage: 'Sesión expirada. Inicia sesión para sincronizar.', syncStatus: 'error', syncError: 'Sesión expirada' });
            syncInProgressRef.current = false;
            return;
          }

          useErpStore.setState({ syncMessage: `Sincronizando ${queue.length} cambios...`, syncStatus: 'loading', syncError: undefined });
          const processed: string[] = [];
          const failed: Mutation[] = [];

          const chunkArray = (arr: any[], size: number): any[][] => {
            const out: any[][] = [];
            for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
            return out;
          };

          const batches = queue.reduce((acc, m) => {
            const tbl = MUTATION_TABLE_MAP[m.type];
            if (!tbl) { processed.push(m.id); return acc; }
            acc[tbl] = acc[tbl] || { INSERT: [], UPDATE: [], DELETE: [], SPECIAL: [] };
            if (m.type === 'addComentarioMuro' || m.type === 'likePublicacionMuro') acc[tbl].SPECIAL.push(m);
            else if (m.type === 'clearProyectos') acc[tbl].DELETE.push(m);
            else if (m.type.startsWith('add')) acc[tbl].INSERT.push(m);
            else if (m.type.startsWith('update') || m.type.startsWith('mark')) acc[tbl].UPDATE.push(m);
            else if (m.type.startsWith('delete')) acc[tbl].DELETE.push(m);
            return acc;
          }, {} as Record<string, { INSERT: Mutation[]; UPDATE: Mutation[]; DELETE: Mutation[]; SPECIAL: Mutation[] }>);

          const processOps = async (table: string, ops: { INSERT: Mutation[]; UPDATE: Mutation[]; DELETE: Mutation[]; SPECIAL: Mutation[] }) => {
            const tableProcessed: string[] = [];
            const tableFailed: Mutation[] = [];
            try {
              if (ops.SPECIAL.length) {
                for (const m of ops.SPECIAL) {
                  const payload = toSnake(sanitizarObjeto(m.payload));
                  if (m.type === 'addComentarioMuro') {
                    const { publicacion_id, comentario } = payload;
                    const { error } = await client.rpc('append_comentario_muro', { pub_id: publicacion_id, comentario });
                    if (error) throw error;
                  } else if (m.type === 'likePublicacionMuro') {
                    const { id } = payload;
                    const { error } = await client.rpc('increment_likes_muro', { pub_id: id });
                    if (error) throw error;
                  }
                  tableProcessed.push(m.id);
                }
              }
               const BATCH_SIZE = 50;
              for (const chunk of chunkArray(ops.INSERT, BATCH_SIZE)) {
                const payload = chunk.map(m => toSnake(stripAppOnlyFields(sanitizarObjeto(m.payload) as Record<string, unknown>)));
                const { error } = await client.from(table).insert(payload).onConflict('id').ignore();
                if (error) throw error;
                tableProcessed.push(...chunk.map(m => m.id));
              }
              for (const chunk of chunkArray(ops.UPDATE, BATCH_SIZE)) {
                for (const m of chunk) {
                  const p = toSnake(stripAppOnlyFields(sanitizarObjeto(m.payload) as Record<string, unknown>));
                  if (!p.id) continue;
                  const { error } = await client.from(table).update(p).eq('id', p.id);
                  if (error) throw error;
                }
                tableProcessed.push(...chunk.map(m => m.id));
              }
              for (const chunk of chunkArray(ops.DELETE, BATCH_SIZE)) {
                const ids = chunk.map(m => m.payload.id).filter(Boolean);
                if (ids.length) {
                  const { error } = await client.from(table).delete().in('id', ids);
                  if (error) throw error;
                }
                tableProcessed.push(...chunk.map(m => m.id));
              }
            } catch (err) {
              const error = err instanceof Error ? err.message : String(err);
              const errObj = err as any;
               if (errObj?.code === '23503') {
                safeLogger.warn(`[forceSync] FK violation on ${table}:`, errObj.details || errObj.message);
                logErrorFromException(err instanceof Error ? err : new Error(error), {
                  component: 'ErpProvider',
                  function_name: 'forceSync',
                  error_type: 'database',
                  severity: 'error',
                  additional_context: { table, operation: 'fk_violation_23503', details: errObj.details, mutationCount: ops.INSERT.length + ops.UPDATE.length + ops.DELETE.length }
                });
                ops.INSERT.forEach(m => { if (m.retryCount >= 3) tableProcessed.push(m.id); else tableFailed.push({ ...m, retryCount: (m.retryCount || 0) + 1 }); });
                ops.UPDATE.forEach(m => { if (m.retryCount >= 3) tableProcessed.push(m.id); else tableFailed.push({ ...m, retryCount: (m.retryCount || 0) + 1 }); });
                ops.DELETE.forEach(m => { if (m.retryCount >= 3) tableProcessed.push(m.id); else tableFailed.push({ ...m, retryCount: (m.retryCount || 0) + 1 }); });
                return { tableProcessed, tableFailed };
              }
              if (errObj?.code === '23505') {
                safeLogger.warn(`[forceSync] Duplicate key on ${table}:`, errObj.details || errObj.message);
                logErrorFromException(err instanceof Error ? err : new Error(error), {
                  component: 'ErpProvider',
                  function_name: 'forceSync',
                  error_type: 'database',
                  severity: 'warning',
                  additional_context: { table, operation: 'duplicate_key_23505', details: errObj.details, mutationCount: ops.INSERT.length + ops.UPDATE.length + ops.DELETE.length }
                });
                ops.INSERT.forEach(m => tableProcessed.push(m.id));
                ops.UPDATE.forEach(m => tableProcessed.push(m.id));
                ops.DELETE.forEach(m => tableProcessed.push(m.id));
                return { tableProcessed, tableFailed };
              }
              safeLogger.warn(`[forceSync] Batch ${table} failed:`, error);
              logErrorFromException(err instanceof Error ? err : new Error(error), {
                component: 'ErpProvider',
                function_name: 'forceSync',
                error_type: 'database',
                severity: 'error',
                additional_context: { table, operation: 'batch_sync', mutationCount: ops.INSERT.length + ops.UPDATE.length + ops.DELETE.length }
              });
              ops.INSERT.forEach(m => {
                if (m.retryCount >= 3) tableProcessed.push(m.id);
                else tableFailed.push({ ...m, retryCount: (m.retryCount || 0) + 1 });
              });
              ops.UPDATE.forEach(m => {
                if (m.retryCount >= 3) tableProcessed.push(m.id);
                else tableFailed.push({ ...m, retryCount: (m.retryCount || 0) + 1 });
              });
              ops.DELETE.forEach(m => {
                if (m.retryCount >= 3) tableProcessed.push(m.id);
                else tableFailed.push({ ...m, retryCount: (m.retryCount || 0) + 1 });
              });
            }
            return { tableProcessed, tableFailed };
          };

          await Promise.all(
            Object.keys(batches).map(table => processOps(table, batches[table]))
          ).then((results) => {
            results.forEach(({ tableProcessed, tableFailed }) => {
              processed.push(...tableProcessed);
              failed.push(...tableFailed);
            });
          });

          const remaining = queue.filter(m => !processed.includes(m.id));
          failed.forEach(f => { if (!remaining.find(r => r.id === f.id)) remaining.push(f); });
          useErpStore.getState().setMutationQueue(remaining);

          if (processed.length > 0 || failed.length > 0) {
            const msg = processed.length > 0 ? `${processed.length} cambios sincronizados.` : '';
            const errMsg = failed.length > 0 ? ` ${failed.length} fallaron` : '';
            useErpStore.setState({ syncMessage: msg + errMsg, syncStatus: failed.length > 0 ? 'error' : 'synced', syncError: failed.length > 0 ? 'Algunos cambios fallaron' : undefined, lastSyncedAt: new Date().toISOString() });
            if (msg) { setTimeout(() => useErpStore.setState({ syncMessage: '' }), 3000); await fetchInitialData(); }
          }
          syncInProgressRef.current = false;
        };
      }, []);

  const lastQueueLenRef = useRef(0);
  useEffect(() => {
    const unsub = useErpStore.subscribe((s) => {
      const len = s.mutationQueue.length;
      if (len > lastQueueLenRef.current && isOnlineRef.current) forceSync();
      lastQueueLenRef.current = len;
    });
    return unsub;
  }, [forceSync]);
useEffect(() => { if (isOnlineRef.current && useErpStore.getState().mutationQueue.length > 0) forceSync(); }, [isOnline, forceSync]);

   // Listen for browser online/offline events to trigger sync when connection returns
   useEffect(() => {
     const handleOnline = () => {
       if (useErpStore.getState().mutationQueue.length > 0) {
         forceSync();
       }
     };
     
     window.addEventListener('online', handleOnline);
     return () => window.removeEventListener('online', handleOnline);
   }, [forceSync]);

    useEffect(() => {
     let timer: ReturnType<typeof setTimeout>;
    const unsub = useErpStore.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
     const s = useErpStore.getState();
     const map: Record<string, any> = {
       proyectos: s.proyectos, movimientos: s.movimientos, empleados: s.empleados, materiales: s.materiales,
       ordenes: s.ordenes, proveedores: s.proveedores, eventos: s.eventos, presupuestos: s.presupuestos,
       avances: s.avances, cuentasCobrar: s.cuentasCobrar, cuentasPagar: s.cuentasPagar,
       ordenesCambio: s.ordenesCambio, hitos: s.hitos, riesgos: s.riesgos, licitaciones: s.licitaciones,
       cotizacionesNegocio: s.cotizacionesNegocio,
          seguimiento_evm: s.seguimientoEVM, incidentes: s.incidentes, publicacionesMuro: s.publicacionesMuro,
          liberaciones: s.liberaciones, planos: s.planos, rfis: s.rfis, submittals: s.submittals,
          activos: s.activos, cuadros: s.cuadros, pagosProveedor: s.pagosProveedor,
          destajos: s.destajos, calculosProyecto: s.calculosProyecto, recepciones: s.recepciones, centrosCosto: s.centrosCosto,
        plantillas: s.plantillas, insumos_base: s.insumosBase, weather: s.proyectoWeather,
        escalasProduccion: s.escalasProduccion, estacionalidad: s.estacionalidad, historialReglas: s.historialReglas,
        bitacora: s.bitacora, no_conformidades: s.ncs, pruebas: s.pruebas, ventas_paquetes: s.ventasPaquetes,
        vales_salida: s.valesSalida, reglas_factores: s.reglasFactores,
        normativas_departamentales: s.normativasDepartamentales,
        ajustes_estacionales: s.ajustesEstacionalesActividad, aplicacion_escalas: s.aplicacionEscalas,
        cumplimiento_normativo: s.cumplimientoNormativo, error_logs: s.errorLogs,
        };
          const quotaCritical = isStorageQuotaCritical();
          for (const [k, v] of Object.entries(map)) {
            try { const value = await compressDataAsync(v); safeSetItem(`${BASE_STORAGE_KEY}_${k}`, value, `${BASE_STORAGE_KEY}_${k}`); } catch {}
          }
          safeSetItem(`${BASE_STORAGE_KEY}_settings`, JSON.stringify(s.appSettings));
          try { const q = await compressDataAsync(s.mutationQueue); safeSetItem('wm_erp_queue', q); } catch {}
          try { const n = await compressDataAsync(s.notificaciones); safeSetItem(`${BASE_STORAGE_KEY}_notificaciones`, n); } catch {}
          try { const a = await compressDataAsync(s.auditLog); safeSetItem(`${BASE_STORAGE_KEY}_audit_log`, a); } catch {}
          try { const pp = await compressDataAsync(s.projectProfitabilities); safeSetItem(`${PROFITABILITY_KEY}_projects`, pp); } catch {}
          try { const cp = await compressDataAsync(s.clientProfitabilities); safeSetItem(`${PROFITABILITY_KEY}_clients`, cp); } catch {}
          try { const re = await compressDataAsync(s.resourceEfficiencies); safeSetItem(`${PROFITABILITY_KEY}_resources`, re); } catch {}
          try { const pt = await compressDataAsync(s.profitabilityTrends); safeSetItem(`${PROFITABILITY_KEY}_trends`, pt); } catch {}
          
          encryptionManager.encryptItem(AUDIT_KEY, s.auditLog, user?.id || 'default')
            .then(() => safeLogger.log('[Encryption] auditLog encrypted'))
            .catch(err => safeLogger.warn('[Encryption] Failed to encrypt auditLog:', err));
          
          encryptionManager.encryptItem(BASE_STORAGE_KEY + '_settings', s.appSettings, user?.id || 'default')
            .then(() => safeLogger.log('[Encryption] appSettings encrypted'))
            .catch(err => safeLogger.warn('[Encryption] Failed to encrypt appSettings:', err));
          
          if (quotaCritical) safeLogger.warn('[Storage] Cuota de localStorage casi llena — usando compresión');
        } catch (e) { safeLogger.warn('[Storage] Error al persistir:', e); }
      }, 500);
    });
    return () => { unsub(); clearTimeout(timer); };
  }, [user?.id]);

  const allowedViews = useMemo(() => {
    if (!user?.rol) return ALL_VIEWS;
    try {
      const views = getViewsByRole(user.rol as any);
      return views.length > 0 ? views : ALL_VIEWS;
    } catch {
      return ALL_VIEWS;
    }
  }, [user?.rol]);

  const notificacionesNoLeidas = useErpStore(s => s.notificaciones.filter(n => !n.leido).length);

  const currentProject = useMemo(() => {
    if (!currentProjectId) return null;
    return useErpStore.getState().proyectos.find(p => p.id === currentProjectId) || null;
  }, [currentProjectId]);

 const ctxValue = useMemo(() => ({
      view, setView, user, initializing, isOnline, notificacionesNoLeidas,
      signInWithGoogle: realSignInWithGoogle,
       logout: handleLogout,
      allowedViews, forceSync,
      currentProjectId,
      setCurrentProjectId,
      currentProject,
    }), [view, user, initializing, isOnline, notificacionesNoLeidas, realSignInWithGoogle, handleLogout, allowedViews, forceSync, currentProjectId, setCurrentProjectId, currentProject]);

const realtimeChannelsRef = useRef<ReturnType<typeof client.channel>[]>([]);
useEffect(() => {
  if (!isOnline) return;
  const channelsArr = realtimeChannelsRef.current;
  
  const subscribeToRealtime = async () => {
    if (supabaseSubscriptionsRef.current) return;
    
    const client = assertSupabase();
    
    const subs: string[] = [
      'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
      'erp_ordenes_compra', 'erp_proveedores', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
      'erp_hitos', 'erp_riesgos', 'erp_licitaciones', 'erp_cotizaciones_negocio',
      'erp_vales_salida', 'erp_no_conformidades', 'erp_incidentes', 'erp_planos',
      'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros', 'erp_pagos_proveedor',
      'erp_destajos', 'erp_recepciones', 'erp_centros_costo', 'erp_seguimiento',
      'erp_bitacora', 'erp_pruebas_laboratorio', 'erp_liberaciones_partida',
      'erp_plantillas_proyectos', 'erp_presupuestos', 'erp_avances',
      'erp_muro', 'erp_ventas_paquetes', 'erp_proyecto_weather',
    ];
    
    const promises = subs.map(table => new Promise<void>((resolve, reject) => {
      const channel = client.channel(`public:${table}`);
      channelsArr.push(channel);
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          const storeKey = STORE_KEY_MAP[table] || table;
          const toStoreRecord = (raw: any) => raw ? toCamel(raw) : raw;
          
          if (payload.eventType === 'INSERT') {
            useErpStore.setState(prev => {
              const arr: any[] = (prev as any)[storeKey] ?? [];
              const normalized = toStoreRecord(newRecord);
              if (Array.isArray(arr) && normalized?.id && !arr.some((item: any) => item.id === normalized.id)) {
                return { ...prev, [storeKey]: [normalized, ...arr] } as any;
              }
              return prev;
            });
          } else if (payload.eventType === 'UPDATE') {
            useErpStore.setState(prev => {
              const arr: any[] = (prev as any)[storeKey] ?? [];
              const normalized = toStoreRecord(newRecord);
              if (Array.isArray(arr) && normalized?.id) {
                const idx = arr.findIndex((item: any) => item.id === normalized.id);
                if (idx !== -1) {
                  const updated = [...arr];
                  updated[idx] = normalized;
                  return { ...prev, [storeKey]: updated } as any;
                }
              }
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            useErpStore.setState(prev => {
              const arr: any[] = (prev as any)[storeKey] ?? [];
              if (Array.isArray(arr) && oldRecord?.id) {
                return { ...prev, [storeKey]: arr.filter((item: any) => item.id !== oldRecord.id) } as any;
              }
              return prev;
            });
          }
        })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') resolve();
          else if (status === 'CHANNEL_ERROR') reject(new Error(`Failed to subscribe to ${table}`));
        });
    }));
    
    await Promise.all(promises);
    supabaseSubscriptionsRef.current = true;
  };
  
  subscribeToRealtime().catch(() => {});
  
  return () => {
    channelsArr.forEach(ch => { try { ch.unsubscribe(); } catch {} });
    channelsArr.length = 0;
    supabaseSubscriptionsRef.current = false;
  };
}, [isOnline]);

  return <Ctx.Provider value={ctxValue}>{children}</Ctx.Provider>;
};



