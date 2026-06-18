import { create } from 'zustand';
import { z } from 'zod';
import { sanitizarObjeto } from '@/lib/security';
import { safeLogger } from '@/lib/safeLogger';
import { supabase } from '@/lib/supabase';
import { setEmpresaInfo, APP_SETTINGS_DEFAULTS, toSnake, toCamel } from './utils';
import type {
  Proyecto, Movimiento, Empleado, Material, OrdenCompra, Proveedor, EventoCalendario, BitacoraEntry,
  Presupuesto, Licitacion, AvanceObra, ValeSalida, Notificacion, OrdenCambio, SeguimientoEVM,
  CuentaCobrar, CuentaPagar, Hito, Riesgo, PublicacionMuro, ComentarioMuro, PruebaLaboratorio,
  NoConformidad, LiberacionPartida, Plano, RFI, Submittal, ActivoHerramienta, CuadroComparativo,
  PagoProveedor, CotizacionCliente, VentaPaquete, Destajo, RecepcionAlmacen, Incidente, Rol, CentroCosto,
} from './types';
import type { AppSettings, Mutation, LogAuditoria } from './store';

const RATE_LIMIT_MS = 100;
const lastMutationCall: Record<string, number> = {};

function checkRateLimit(type: string): boolean {
  const now = Date.now();
  const last = lastMutationCall[type];
  if (last && now - last < RATE_LIMIT_MS) { console.warn(`[RateLimit] ${type} bloqueada`); return false; }
  lastMutationCall[type] = now;
  return true;
}

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0>>(c==='x'?0:1)).toString(16));
}

interface ErpData {
  proyectos: Proyecto[]; movimientos: Movimiento[]; empleados: Empleado[]; materiales: Material[];
  ordenes: OrdenCompra[]; proveedores: Proveedor[]; eventos: EventoCalendario[]; presupuestos: Presupuesto[];
  avances: AvanceObra[]; cuentasCobrar: CuentaCobrar[]; cuentasPagar: CuentaPagar[];
  ordenesCambio: OrdenCambio[]; hitos: Hito[]; riesgos: Riesgo[]; licitaciones: Licitacion[];
  cotizacionesNegocio: CotizacionCliente[]; ventasPaquetes: VentaPaquete[]; bitacora: BitacoraEntry[];
  pruebas: PruebaLaboratorio[]; ncs: NoConformidad[]; valesSalida: ValeSalida[];
  seguimientoEVM: SeguimientoEVM[]; incidentes: Incidente[]; publicacionesMuro: PublicacionMuro[];
  liberaciones: LiberacionPartida[]; planos: Plano[]; rfis: RFI[]; submittals: Submittal[];
  activos: ActivoHerramienta[]; cuadros: CuadroComparativo[]; pagosProveedor: PagoProveedor[];
  destajos: Destajo[]; recepciones: RecepcionAlmacen[]; centrosCosto: CentroCosto[];
  mutationQueue: Mutation[]; syncMessage: string; syncCooldown: boolean; notificaciones: Notificacion[];
  auditLog: LogAuditoria[]; syncStatus: 'idle' | 'loading' | 'synced' | 'queued' | 'error';
  lastSyncedAt?: string; syncError?: string;
  isOnline: boolean; selectedProyectoId: string | null; appSettings: AppSettings;
}

interface ErpActions {
  setProyectos: (v: Proyecto[] | ((prev: Proyecto[]) => Proyecto[])) => void;
  setMovimientos: (v: Movimiento[] | ((prev: Movimiento[]) => Movimiento[])) => void;
  setEmpleados: (v: Empleado[] | ((prev: Empleado[]) => Empleado[])) => void;
  setMateriales: (v: Material[] | ((prev: Material[]) => Material[])) => void;
  setOrdenes: (v: OrdenCompra[] | ((prev: OrdenCompra[]) => OrdenCompra[])) => void;
  setProveedores: (v: Proveedor[] | ((prev: Proveedor[]) => Proveedor[])) => void;
  setEventos: (v: EventoCalendario[] | ((prev: EventoCalendario[]) => EventoCalendario[])) => void;
  setPresupuestos: (v: Presupuesto[] | ((prev: Presupuesto[]) => Presupuesto[])) => void;
  setAvances: (v: AvanceObra[] | ((prev: AvanceObra[]) => AvanceObra[])) => void;
  setCuentasCobrar: (v: CuentaCobrar[] | ((prev: CuentaCobrar[]) => CuentaCobrar[])) => void;
  setCuentasPagar: (v: CuentaPagar[] | ((prev: CuentaPagar[]) => CuentaPagar[])) => void;
  setOrdenesCambio: (v: OrdenCambio[] | ((prev: OrdenCambio[]) => OrdenCambio[])) => void;
  setHitos: (v: Hito[] | ((prev: Hito[]) => Hito[])) => void;
  setRiesgos: (v: Riesgo[] | ((prev: Riesgo[]) => Riesgo[])) => void;
  setLicitaciones: (v: Licitacion[] | ((prev: Licitacion[]) => Licitacion[])) => void;
  setCotizacionesNegocio: (v: CotizacionCliente[] | ((prev: CotizacionCliente[]) => CotizacionCliente[])) => void;
  setVentasPaquetes: (v: VentaPaquete[] | ((prev: VentaPaquete[]) => VentaPaquete[])) => void;
  setBitacora: (v: BitacoraEntry[] | ((prev: BitacoraEntry[]) => BitacoraEntry[])) => void;
  setPruebas: (v: PruebaLaboratorio[] | ((prev: PruebaLaboratorio[]) => PruebaLaboratorio[])) => void;
  setNcs: (v: NoConformidad[] | ((prev: NoConformidad[]) => NoConformidad[])) => void;
  setValesSalida: (v: ValeSalida[] | ((prev: ValeSalida[]) => ValeSalida[])) => void;
  setSeguimientoEVM: (v: SeguimientoEVM[] | ((prev: SeguimientoEVM[]) => SeguimientoEVM[])) => void;
  setIncidentes: (v: Incidente[] | ((prev: Incidente[]) => Incidente[])) => void;
  setPublicacionesMuro: (v: PublicacionMuro[] | ((prev: PublicacionMuro[]) => PublicacionMuro[])) => void;
  setLiberaciones: (v: LiberacionPartida[] | ((prev: LiberacionPartida[]) => LiberacionPartida[])) => void;
  setPlanos: (v: Plano[] | ((prev: Plano[]) => Plano[])) => void;
  setRfis: (v: RFI[] | ((prev: RFI[]) => RFI[])) => void;
  setSubmittals: (v: Submittal[] | ((prev: Submittal[]) => Submittal[])) => void;
  setActivos: (v: ActivoHerramienta[] | ((prev: ActivoHerramienta[]) => ActivoHerramienta[])) => void;
  setCuadros: (v: CuadroComparativo[] | ((prev: CuadroComparativo[]) => CuadroComparativo[])) => void;
  setPagosProveedor: (v: PagoProveedor[] | ((prev: PagoProveedor[]) => PagoProveedor[])) => void;
  setDestajos: (v: Destajo[] | ((prev: Destajo[]) => Destajo[])) => void;
  setRecepciones: (v: RecepcionAlmacen[] | ((prev: RecepcionAlmacen[]) => RecepcionAlmacen[])) => void;
  setCentrosCosto: (v: CentroCosto[] | ((prev: CentroCosto[]) => CentroCosto[])) => void;
  setMutationQueue: (v: Mutation[] | ((prev: Mutation[]) => Mutation[])) => void;
  setSyncMessage: (v: string) => void;
  setSyncCooldown: (v: boolean) => void;
  setSyncStatus: (v: ErpData['syncStatus']) => void;
  setLastSyncedAt: (v?: string) => void;
  setSyncError: (v?: string) => void;
  deleteProyecto: (id: string) => void;
  clearProyectos: () => void;
  clearAllData: () => void;
  setNotificaciones: (v: Notificacion[] | ((prev: Notificacion[]) => Notificacion[])) => void;
  setIsOnline: (v: boolean) => void;
  setSelectedProyectoId: (v: string | null) => void;
  setAppSettings: (v: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  updateAppSettings: (patch: Partial<AppSettings>) => void;
  deleteOrden: (id: string) => void;
  deleteNotificacion: (id: string) => void;
  enqueueMutation: (type: string, payload: Record<string, any>) => string;
  addAuditEntry: (entry: Omit<LogAuditoria, 'id' | 'createdAt'>) => void;
  setAuditLog: (v: LogAuditoria[] | ((prev: LogAuditoria[]) => LogAuditoria[])) => void;
}

export type ErpStore = ErpData & ErpActions;

function normalizarFilaSupabase(row: Record<string, any>): Record<string, any> {
  const normalized = toCamel(row) as Record<string, any>;
  if (normalized.fotoUrl) {
    normalized.foto = normalized.fotoUrl;
    delete normalized.fotoUrl;
  }
  if (normalized.fotos === '{}' || normalized.fotos === '[]') {
    normalized.fotos = [];
  }
  if (normalized.geoLocation) {
    try {
      const geo = JSON.parse(normalized.geoLocation);
      if (geo?.lat) normalized.latitud = geo.lat;
      if (geo?.lng) normalized.longitud = geo.lng;
    } catch {}
  }
  return normalized;
}

export const fetchInitialData = async (attempt = 1): Promise<boolean> => {
  try {
    useErpStore.setState({ syncStatus: 'loading', syncError: undefined });
    if (!supabase) return false;

    const TABLES = [
      'erp_proyectos','erp_movimientos','erp_empleados','erp_materiales',
      'erp_ordenes_compra','erp_proveedores','erp_presupuestos','erp_avances',
      'erp_cuentas_cobrar','erp_cuentas_pagar','erp_ordenes_cambio',
      'erp_hitos','erp_riesgos','erp_licitaciones','erp_cotizaciones_negocio',
      'erp_vales_salida','erp_no_conformidades','erp_incidentes',
      'erp_publicaciones_muro','erp_planos',
      'erp_rfis','erp_submittals','erp_activos','destajos',
      'erp_eventos_calendario','erp_bitacora','erp_seguimiento',
      'erp_liberaciones_partida','erp_notificaciones','erp_cuadros',
      'recepciones_almacen','erp_pruebas_laboratorio','ventas_paquetes',
      'pagos_proveedores','erp_renglones','erp_insumos','erp_sub_renglones',
      'erp_insumos_base','erp_rendimientos_cuadrilla','centros_costo',
    ] as const;

    const TABLE_MAP: Record<string, string> = {
      erp_proyectos:'proyectos',erp_movimientos:'movimientos',erp_empleados:'empleados',
      erp_materiales:'materiales',erp_ordenes_compra:'ordenes',erp_proveedores:'proveedores',
      erp_presupuestos:'presupuestos',erp_avances:'avances',
      erp_cuentas_cobrar:'cuentasCobrar',erp_cuentas_pagar:'cuentasPagar',
      erp_ordenes_cambio:'ordenesCambio',erp_hitos:'hitos',erp_riesgos:'riesgos',
      erp_licitaciones:'licitaciones',erp_cotizaciones_negocio:'cotizacionesNegocio',
      erp_vales_salida:'valesSalida',erp_no_conformidades:'ncs',erp_incidentes:'incidentes',
      erp_publicaciones_muro:'publicacionesMuro',
      erp_planos:'planos',erp_rfis:'rfis',erp_submittals:'submittals',
      erp_activos:'activos',destajos:'destajos',
      erp_eventos_calendario:'eventos',erp_bitacora:'bitacora',
      erp_seguimiento:'seguimientoEVM',erp_liberaciones_partida:'liberaciones',
      erp_notificaciones:'notificaciones',erp_cuadros:'cuadros',
      recepciones_almacen:'recepciones',erp_pruebas_laboratorio:'pruebas',
      ventas_paquetes:'ventasPaquetes',pagos_proveedores:'pagosProveedor',
      erp_renglones:'renglones',erp_insumos:'insumos',erp_sub_renglones:'subRenglones',
      erp_insumos_base:'insumosBase',erp_rendimientos_cuadrilla:'rendimientosCuadrilla',
      centros_costo:'centrosCosto',
    };

    const results = await Promise.allSettled(TABLES.map(async (table) => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) { safeLogger.warn(`[fetchInitialData] Error en ${table}: ${error.message}`); return null; }
      return { table, data: (data || []).map(normalizarFilaSupabase) };
    }));

    const statePatch: Record<string, any> = {};
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const { table, data } = result.value;
        const stateKey = TABLE_MAP[table];
        if (stateKey) statePatch[stateKey] = data;
      }
    }

    if (Object.keys(statePatch).length > 0) {
      useErpStore.setState({ ...statePatch, syncStatus: 'synced', lastSyncedAt: new Date().toISOString(), syncError: undefined });
      safeLogger.log(`[fetchInitialData] Cargados datos de ${Object.keys(statePatch).length} tablas desde Supabase`);
      (window as any).__FETCH_RETRY = 0;
      return true;
    }
    useErpStore.setState({ syncStatus: 'synced', lastSyncedAt: new Date().toISOString(), syncError: undefined });
    (window as any).__FETCH_RETRY = 0;
    return true;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    useErpStore.setState({ syncStatus: 'error', syncError: error });
    safeLogger.warn('[fetchInitialData] Error general:', err);
    const next = (window as any).__FETCH_RETRY || 0;
    (window as any).__FETCH_RETRY = next + 1;
    if (attempt > 10) {
      safeLogger.warn('[fetchInitialData] Max retries exceeded, giving up');
      useErpStore.setState({ syncStatus: 'error', syncError: 'Error de conexión tras múltiples reintentos' });
      return false;
    }
    const backoff = Math.min(1000 * Math.pow(2, Math.min(next, 5)), 30000);
    safeLogger.warn(`[fetchInitialData] Reintento ${next + 1} en ${backoff}ms (keepAlive)`);
    await new Promise(r => setTimeout(r, backoff));
    return fetchInitialData(attempt + 1);
  }
};

export const useErpStore = create<ErpStore>()((set, get) => ({
  proyectos: [], movimientos: [], empleados: [], materiales: [], ordenes: [], proveedores: [],
  eventos: [], presupuestos: [], avances: [], cuentasCobrar: [], cuentasPagar: [],
  ordenesCambio: [], hitos: [], riesgos: [], licitaciones: [], cotizacionesNegocio: [],
  ventasPaquetes: [], bitacora: [], pruebas: [], ncs: [], valesSalida: [],
  seguimientoEVM: [], incidentes: [], publicacionesMuro: [], liberaciones: [], planos: [],
  rfis: [], submittals: [], activos: [], cuadros: [], pagosProveedor: [], destajos: [],
    recepciones: [], centrosCosto: [],
  mutationQueue: [], syncMessage: '', syncCooldown: false, syncStatus: 'idle',
  notificaciones: [],
  auditLog: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  selectedProyectoId: null,
  appSettings: APP_SETTINGS_DEFAULTS,

  setProyectos: (v) => set(typeof v === 'function' ? { proyectos: v(get().proyectos) } : { proyectos: v }),
  setMovimientos: (v) => set(typeof v === 'function' ? { movimientos: v(get().movimientos) } : { movimientos: v }),
  setEmpleados: (v) => set(typeof v === 'function' ? { empleados: v(get().empleados) } : { empleados: v }),
  setMateriales: (v) => set(typeof v === 'function' ? { materiales: v(get().materiales) } : { materiales: v }),
  setOrdenes: (v) => set(typeof v === 'function' ? { ordenes: v(get().ordenes) } : { ordenes: v }),
  setProveedores: (v) => set(typeof v === 'function' ? { proveedores: v(get().proveedores) } : { proveedores: v }),
  setEventos: (v) => set(typeof v === 'function' ? { eventos: v(get().eventos) } : { eventos: v }),
  setPresupuestos: (v) => set(typeof v === 'function' ? { presupuestos: v(get().presupuestos) } : { presupuestos: v }),
  setAvances: (v) => set(typeof v === 'function' ? { avances: v(get().avances) } : { avances: v }),
  setCuentasCobrar: (v) => set(typeof v === 'function' ? { cuentasCobrar: v(get().cuentasCobrar) } : { cuentasCobrar: v }),
  setCuentasPagar: (v) => set(typeof v === 'function' ? { cuentasPagar: v(get().cuentasPagar) } : { cuentasPagar: v }),
  setOrdenesCambio: (v) => set(typeof v === 'function' ? { ordenesCambio: v(get().ordenesCambio) } : { ordenesCambio: v }),
  setHitos: (v) => set(typeof v === 'function' ? { hitos: v(get().hitos) } : { hitos: v }),
  setRiesgos: (v) => set(typeof v === 'function' ? { riesgos: v(get().riesgos) } : { riesgos: v }),
  setLicitaciones: (v) => set(typeof v === 'function' ? { licitaciones: v(get().licitaciones) } : { licitaciones: v }),
  setCotizacionesNegocio: (v) => set(typeof v === 'function' ? { cotizacionesNegocio: v(get().cotizacionesNegocio) } : { cotizacionesNegocio: v }),
  setVentasPaquetes: (v) => set(typeof v === 'function' ? { ventasPaquetes: v(get().ventasPaquetes) } : { ventasPaquetes: v }),
  setBitacora: (v) => set(typeof v === 'function' ? { bitacora: v(get().bitacora) } : { bitacora: v }),
  setPruebas: (v) => set(typeof v === 'function' ? { pruebas: v(get().pruebas) } : { pruebas: v }),
  setNcs: (v) => set(typeof v === 'function' ? { ncs: v(get().ncs) } : { ncs: v }),
  setValesSalida: (v) => set(typeof v === 'function' ? { valesSalida: v(get().valesSalida) } : { valesSalida: v }),
  setSeguimientoEVM: (v) => set(typeof v === 'function' ? { seguimientoEVM: v(get().seguimientoEVM) } : { seguimientoEVM: v }),
  setIncidentes: (v) => set(typeof v === 'function' ? { incidentes: v(get().incidentes) } : { incidentes: v }),
  setPublicacionesMuro: (v) => set(typeof v === 'function' ? { publicacionesMuro: v(get().publicacionesMuro) } : { publicacionesMuro: v }),
  setLiberaciones: (v) => set(typeof v === 'function' ? { liberaciones: v(get().liberaciones) } : { liberaciones: v }),
  setPlanos: (v) => set(typeof v === 'function' ? { planos: v(get().planos) } : { planos: v }),
  setRfis: (v) => set(typeof v === 'function' ? { rfis: v(get().rfis) } : { rfis: v }),
  setSubmittals: (v) => set(typeof v === 'function' ? { submittals: v(get().submittals) } : { submittals: v }),
  setActivos: (v) => set(typeof v === 'function' ? { activos: v(get().activos) } : { activos: v }),
  setCuadros: (v) => set(typeof v === 'function' ? { cuadros: v(get().cuadros) } : { cuadros: v }),
  setPagosProveedor: (v) => set(typeof v === 'function' ? { pagosProveedor: v(get().pagosProveedor) } : { pagosProveedor: v }),
  setDestajos: (v) => set(typeof v === 'function' ? { destajos: v(get().destajos) } : { destajos: v }),
  setRecepciones: (v) => set(typeof v === 'function' ? { recepciones: v(get().recepciones) } : { recepciones: v }),
  setMutationQueue: (v) => set(typeof v === 'function' ? { mutationQueue: v(get().mutationQueue) } : { mutationQueue: v }),
  setSyncMessage: (v) => set({ syncMessage: v }),
  setSyncCooldown: (v) => set({ syncCooldown: v }),
  setSyncStatus: (v) => set({ syncStatus: v }),
  setLastSyncedAt: (v) => set({ lastSyncedAt: v }),
  setSyncError: (v) => set({ syncError: v }),
  setNotificaciones: (v) => set(typeof v === 'function' ? { notificaciones: v(get().notificaciones) } : { notificaciones: v }),
  setIsOnline: (v) => set({ isOnline: v }),
  setSelectedProyectoId: (v) => set({ selectedProyectoId: v }),
  setAppSettings: (v) => set(typeof v === 'function' ? { appSettings: v(get().appSettings) } : { appSettings: v }),
  updateAppSettings: (patch) => set(s => ({ appSettings: { ...s.appSettings, ...patch } })),
  setAuditLog: (v) => set(typeof v === 'function' ? { auditLog: v(get().auditLog) } : { auditLog: v }),

  enqueueMutation: (type, payload) => {
    if (!checkRateLimit(type)) return '';
    const sanitized = sanitizarObjeto(payload);
    const safePayload = toSnake(sanitized);
    const mutation: Mutation = { id: uid(), type, payload: safePayload, timestamp: Date.now(), retryCount: 0 };
    get().setMutationQueue(q => { const trimmed = q.length >= 100 ? q.slice(1) : q; return [...trimmed, mutation]; });
    return mutation.id;
  },

  addAuditEntry: (entry) => {
    const record: LogAuditoria = {
      ...entry,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    get().setAuditLog(prev => {
      const trimmed = prev.length >= 200 ? prev.slice(prev.length - 199) : prev;
      return [...trimmed, record];
    });
  },

  addProyecto: (p) => {
    const n = { ...p, id: uid(), version: 1 } as Proyecto;
    get().setProyectos(prev => [n, ...prev]);
    get().enqueueMutation('addProyecto', n);
    get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'crear', entidad: 'proyecto', entidadId: n.id, valoresNuevos: { nombre: n.nombre, estado: n.estado, presupuestoTotal: n.presupuestoTotal } });
  },
  updateProyecto: (id, patch) => {
    const proyecto = get().proyectos.find(p => p.id === id);
    if (!proyecto) return;
    const oldEstado = proyecto.estado; const newEstado = patch.estado || oldEstado;
    const transicionesValidas: Record<string, string[]> = { planeacion: ['ejecucion'], ejecucion: ['pausado','finalizado'], pausado: ['ejecucion'], finalizado: [] };
    if (oldEstado !== newEstado && !transicionesValidas[oldEstado]?.includes(newEstado)) { console.warn(`[StateMachine] Transición inválida: ${oldEstado} → ${newEstado}`); return; }
    if (newEstado === 'ejecucion' && oldEstado === 'planeacion') {
      const tienePresupuesto = get().presupuestos.some(p => p.proyectoId === id && p.estado === 'aprobado');
      const tieneHitos = get().hitos.some(h => h.proyectoId === id);
      if (!tienePresupuesto) { console.warn('[StateMachine] Requiere presupuesto aprobado'); return; }
      if (!tieneHitos) { console.warn('[StateMachine] Requiere al menos un hito definido'); return; }
    }
    if (newEstado === 'pausado' && !patch.motivoPausa) { console.warn('[StateMachine] motivoPausa es requerido para pausar'); return; }
    if (newEstado === 'finalizado' && oldEstado === 'ejecucion') {
      const current = get().proyectos.find(p => p.id === id);
      if (current && (current.avanceFisico < 100 || current.avanceFinanciero < 100)) { console.warn('[StateMachine] Requiere avance 100% para finalizar'); return; }
    }
    const etapaValida: Record<string, string[]> = { planeacion: ['planificacion','diseno','preconstruccion'], ejecucion: ['construccion'], pausado: ['planificacion','diseno','preconstruccion','construccion','cierre'], finalizado: ['cierre'] };
    if (newEstado && patch.etapa && !etapaValida[newEstado]?.includes(patch.etapa)) { console.warn(`[StateMachine] Inconsistencia: estado=${newEstado} no permite etapa=${patch.etapa}`); return; }
    if (oldEstado === 'planeacion' && (patch.avanceFisico && patch.avanceFisico > 0)) { console.warn('[StateMachine] Proyecto en planeación no puede tener avance físico > 0'); return; }
    if (oldEstado === 'planeacion' && (patch.avanceFinanciero && patch.avanceFinanciero > 0)) { console.warn('[StateMachine] Proyecto en planeación no puede tener avance financiero > 0'); return; }
    if (newEstado === 'finalizado') patch = { ...patch, avanceFisico: 100, avanceFinanciero: 100 };
    const expectedVersion = proyecto.version || 1;
    if (patch.version !== undefined && patch.version < expectedVersion) { console.warn(`[OptimisticLock] Proyecto ${id}: versión esperada ${expectedVersion}, recibida ${patch.version}`); return; }
    patch.version = expectedVersion + 1;
    get().setProyectos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    get().enqueueMutation('updateProyecto', { id, ...patch });
    if (oldEstado !== newEstado) {
      get().addAuditEntry({ usuarioNombre: 'sistema', accion: `cambio_estado: ${oldEstado} → ${newEstado}`, entidad: 'proyecto', entidadId: id, valoresAnteriores: { estado: oldEstado, avanceFisico: proyecto.avanceFisico }, valoresNuevos: { estado: newEstado, ...(patch.motivoPausa ? { motivoPausa: patch.motivoPausa } : {}) } });
    }
  },
  deleteProyecto: (id) => {
    const p = get().proyectos.find(x => x.id === id);
    get().setProyectos(prev => prev.filter(p => p.id !== id));
    get().enqueueMutation('deleteProyecto', { id });
    if (p) get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'eliminar', entidad: 'proyecto', entidadId: id, valoresAnteriores: { nombre: p.nombre, estado: p.estado } });
  },
  clearProyectos: () => {
    const ids = get().proyectos.map(p => p.id);
    if (ids.length === 0) return;
    const nombres = get().proyectos.map(p => p.nombre);
    get().setProyectos([]);
    if (ids.includes(get().selectedProyectoId || '')) get().setSelectedProyectoId(null);
    get().enqueueMutation('clearProyectos', { ids });
    get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'eliminar_todo', entidad: 'proyectos', valoresAnteriores: { ids, nombres } });
  },
  clearAllData: () => {
    const STORAGE_PREFIX = 'wm_erp_data';
    get().setProyectos([]);
    get().setMovimientos([]);
    get().setEmpleados([]);
    get().setMateriales([]);
    get().setOrdenes([]);
    get().setProveedores([]);
    get().setEventos([]);
    get().setPresupuestos([]);
    get().setAvances([]);
    get().setCuentasCobrar([]);
    get().setCuentasPagar([]);
    get().setOrdenesCambio([]);
    get().setHitos([]);
    get().setRiesgos([]);
    get().setLicitaciones([]);
    get().setCotizacionesNegocio([]);
    get().setVentasPaquetes([]);
    get().setBitacora([]);
    get().setPruebas([]);
    get().setNcs([]);
    get().setValesSalida([]);
    get().setSeguimientoEVM([]);
    get().setIncidentes([]);
    get().setPublicacionesMuro([]);
    get().setLiberaciones([]);
    get().setPlanos([]);
    get().setRfis([]);
    get().setSubmittals([]);
    get().setActivos([]);
    get().setCuadros([]);
    get().setPagosProveedor([]);
    get().setDestajos([]);
    get().setRecepciones([]);
    get().setMutationQueue([]);
    get().setNotificaciones([]);
    get().setAuditLog([]);
    get().setSelectedProyectoId(null);
    get().setAppSettings(APP_SETTINGS_DEFAULTS);
    get().setSyncMessage('');
    get().setSyncStatus('idle');
    get().setSyncError(undefined);
    get().setLastSyncedAt(undefined);
    // Limpiar localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('wm_')) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  },

  addMovimiento: (m) => { const n = { ...m, id: uid() }; get().setMovimientos(prev => [n, ...prev]); get().enqueueMutation('addMovimiento', n); },
  updateMovimiento: (id, patch) => { get().setMovimientos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateMovimiento', { id, ...patch }); },
  deleteMovimiento: (id) => { get().setMovimientos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteMovimiento', { id }); },

  addEmpleado: (e) => { const n = { ...e, id: uid() }; get().setEmpleados(prev => [n, ...prev]); get().enqueueMutation('addEmpleado', n); },
  updateEmpleado: (id, patch) => { get().setEmpleados(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateEmpleado', { id, ...patch }); },
  deleteEmpleado: (id) => { get().setEmpleados(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteEmpleado', { id }); },

  addMaterial: (m) => { const n = { ...m, id: uid(), version: 1 } as Material; get().setMateriales(prev => [n, ...prev]); get().enqueueMutation('addMaterial', n); },
  updateMaterial: (id, patch) => {
    const existing = get().materiales.find(m => m.id === id);
    if (existing) {
      const expectedVersion = existing.version || 1;
      if (patch.version !== undefined && patch.version < expectedVersion) { console.warn(`[OptimisticLock] Material ${id}: versión esperada ${expectedVersion}, recibida ${patch.version}`); return; }
      patch.version = expectedVersion + 1;
    }
    get().setMateriales(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateMaterial', { id, ...patch });
  },
  deleteMaterial: (id) => { get().setMateriales(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteMaterial', { id }); },

  addOrden: (o) => { const n = { ...o, id: uid(), version: 1 } as OrdenCompra; get().setOrdenes(prev => [n, ...prev]); get().enqueueMutation('addOrden', n); },
  updateOrden: (id, estado) => {
    const orden = get().ordenes.find(o => o.id === id);
    if (!orden) return;
    const expectedVersion = orden.version || 1;
    get().setOrdenes(prev => prev.map(p => p.id === id ? { ...p, estado, version: expectedVersion + 1 } : p));
    if ((estado === 'aprobado' || estado === 'recibida') && orden?.items && !orden.stockActualizado) {
      const ids = orden.items.map(i => i.materialId).filter(Boolean);
      if (ids.length) {
        get().setMateriales(prev => prev.map(m => {
          if (!ids.includes(m.id)) return m;
          const linea = orden.items.find(it => it.materialId === m.id);
          const newStock = m.stock + (linea?.cantidad ?? 0);
          return { ...m, stock: newStock, ultimaActualizacionPresupuesto: new Date().toISOString(), version: (m.version || 1) + 1 };
        }));
        get().setOrdenes(prev => prev.map(p => p.id === id ? { ...p, stockActualizado: true } : p));
      }
    }
    get().enqueueMutation('updateOrden', { id, estado, stockActualizado: true });
  },
  deleteOrden: (id) => { get().setOrdenes(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteOrden', { id }); },

  addProveedor: (p) => { const n = { ...p, id: uid() }; get().setProveedores(prev => [n, ...prev]); get().enqueueMutation('addProveedor', n); },
  updateProveedor: (id, patch) => { get().setProveedores(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateProveedor', { id, ...patch }); },
  deleteProveedor: (id) => { get().setProveedores(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteProveedor', { id }); },

  addEvento: (e) => { const n = { ...e, id: uid() }; get().setEventos(prev => [n, ...prev]); get().enqueueMutation('addEvento', n); },
  updateEvento: (id, patch) => { get().setEventos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateEvento', { id, ...patch }); },
  deleteEvento: (id) => { get().setEventos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteEvento', { id }); },

  addBitacora: (b) => { const n = { ...b, id: uid() }; get().setBitacora(prev => [n, ...prev]); get().enqueueMutation('addBitacora', n); },
  updateBitacora: (id, patch) => { get().setBitacora(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateBitacora', { id, ...patch }); },
  deleteBitacora: (id) => { get().setBitacora(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteBitacora', { id }); },

  addPresupuesto: (p) => { const n = { ...p, id: uid(), version: 1 } as Presupuesto; get().setPresupuestos(prev => [n, ...prev]); get().enqueueMutation('addPresupuesto', n); },
  updatePresupuesto: (id, patch) => {
    const existing = get().presupuestos.find(p => p.id === id);
    if (!existing) return;
    const expectedVersion = existing.version || 1;
    if (patch.version !== undefined && patch.version < expectedVersion) { console.warn(`[OptimisticLock] Presupuesto ${id}: versión esperada ${expectedVersion}, recibida ${patch.version}`); return; }
    let totalCalc = patch.totalCalculado;
    if (patch.renglones) {
      totalCalc = patch.renglones.reduce((acc, r) => acc + (r.totalPV ?? (r.costoMateriales + r.costoManoObra + r.costoEquipo || 0)), 0);
    }
    patch.version = expectedVersion + 1;
    patch.totalCalculado = totalCalc ?? existing.totalCalculado;
    get().setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    get().enqueueMutation('updatePresupuesto', { id, ...patch });
  },
  deletePresupuesto: (id) => { get().setPresupuestos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deletePresupuesto', { id }); },
  getPresupuestoByProyecto: (proyectoId) => get().presupuestos.find(p => p.proyectoId === proyectoId),

  addLicitacion: (l) => { const n = { ...l, id: uid() }; get().setLicitaciones(prev => [n, ...prev]); get().enqueueMutation('addLicitacion', n); },
  updateLicitacion: (id, patch) => { get().setLicitaciones(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateLicitacion', { id, ...patch }); },
  deleteLicitacion: (id) => { get().setLicitaciones(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteLicitacion', { id }); },

  addCotizacion: (c) => {
    const n = { ...c, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    get().setCotizacionesNegocio(prev => [n, ...prev]);
    const { proyectoId: _, ...payload } = n;
    get().enqueueMutation('addCotizacion', payload);
  },
  updateCotizacion: (id, patch) => {
    get().setCotizacionesNegocio(prev => prev.map(p => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
    const { proyectoId: _, ...cleanPatch } = patch;
    get().enqueueMutation('updateCotizacion', { id, ...cleanPatch });
  },
  deleteCotizacion: (id) => { get().setCotizacionesNegocio(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteCotizacion', { id }); },

  addVentaPaquete: (v) => { const n = { ...v, id: uid() }; get().setVentasPaquetes(prev => [n, ...prev]); get().enqueueMutation('addVentaPaquete', n); },

  addAvance: (a) => { const n = { ...a, id: uid() }; get().setAvances(prev => [n, ...prev]); get().enqueueMutation('addAvance', n); },
  deleteAvance: (id) => { get().setAvances(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteAvance', { id }); },

  addSeguimiento: (s) => { const n = { ...s, id: uid() }; get().setSeguimientoEVM(prev => [n, ...prev]); get().enqueueMutation('addSeguimiento', n); },
  updateSeguimiento: (id, patch) => { get().setSeguimientoEVM(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateSeguimiento', { id, ...patch }); },
  deleteSeguimiento: (id) => { get().setSeguimientoEVM(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteSeguimiento', { id }); },

  addValeSalida: (v) => { const n = { ...v, id: uid() }; get().setValesSalida(prev => [n, ...prev]); get().enqueueMutation('addValeSalida', n); },
  deleteValeSalida: (id) => { get().setValesSalida(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteValeSalida', { id }); },

  addCuentaCobrar: (c) => { const n = { ...c, id: uid() }; get().setCuentasCobrar(prev => [n, ...prev]); get().enqueueMutation('addCuentaCobrar', n); },
  updateCuentaCobrar: (id, patch) => { get().setCuentasCobrar(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateCuentaCobrar', { id, ...patch }); },
  deleteCuentaCobrar: (id) => { get().setCuentasCobrar(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteCuentaCobrar', { id }); },

  addCuentaPagar: (c) => { const n = { ...c, id: uid() }; get().setCuentasPagar(prev => [n, ...prev]); get().enqueueMutation('addCuentaPagar', n); },
  updateCuentaPagar: (id, patch) => { get().setCuentasPagar(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateCuentaPagar', { id, ...patch }); },
  deleteCuentaPagar: (id) => { get().setCuentasPagar(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteCuentaPagar', { id }); },

  addOrdenCambio: (o) => { const n = { ...o, id: uid() }; get().setOrdenesCambio(prev => [n, ...prev]); get().enqueueMutation('addOrdenCambio', n); },
  updateOrdenCambio: (id, patch) => { get().setOrdenesCambio(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateOrdenCambio', { id, ...patch }); },
  deleteOrdenCambio: (id) => { get().setOrdenesCambio(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteOrdenCambio', { id }); },

  addHito: (h) => { const n = { ...h, id: uid() }; get().setHitos(prev => [n, ...prev]); get().enqueueMutation('addHito', n); },
  updateHito: (id, patch) => { get().setHitos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateHito', { id, ...patch }); },
  deleteHito: (id) => { get().setHitos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteHito', { id }); },

  addRiesgo: (r) => { const n = { ...r, id: uid() }; get().setRiesgos(prev => [n, ...prev]); get().enqueueMutation('addRiesgo', n); },
  updateRiesgo: (id, patch) => { get().setRiesgos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateRiesgo', { id, ...patch }); },
  deleteRiesgo: (id) => { get().setRiesgos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteRiesgo', { id }); },

  addPlano: (p) => { const n = { ...p, id: uid() }; get().setPlanos(prev => [n, ...prev]); get().enqueueMutation('addPlano', n); },
  updatePlano: (id, patch) => { get().setPlanos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updatePlano', { id, ...patch }); },
  deletePlano: (id) => { get().setPlanos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deletePlano', { id }); },

  addRfi: (r) => { const n = { ...r, id: uid() }; get().setRfis(prev => [n, ...prev]); get().enqueueMutation('addRfi', n); },
  updateRfi: (id, patch) => { get().setRfis(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateRfi', { id, ...patch }); },
  deleteRfi: (id) => { get().setRfis(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteRfi', { id }); },

  addSubmittal: (s) => { const n = { ...s, id: uid() }; get().setSubmittals(prev => [n, ...prev]); get().enqueueMutation('addSubmittal', n); },
  updateSubmittal: (id, patch) => { get().setSubmittals(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateSubmittal', { id, ...patch }); },
  deleteSubmittal: (id) => { get().setSubmittals(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteSubmittal', { id }); },

  addActivo: (a) => { const n = { ...a, id: uid() }; get().setActivos(prev => [n, ...prev]); get().enqueueMutation('addActivo', n); },
  updateActivo: (id, patch) => { get().setActivos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateActivo', { id, ...patch }); },
  deleteActivo: (id) => { get().setActivos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteActivo', { id }); },

  addCuadro: (c) => { const n = { ...c, id: uid() }; get().setCuadros(prev => [n, ...prev]); get().enqueueMutation('addCuadro', n); },
  updateCuadro: (id, patch) => { get().setCuadros(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateCuadro', { id, ...patch }); },
  deleteCuadro: (id) => { get().setCuadros(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteCuadro', { id }); },

  addPagoProveedor: (p) => { const n = { ...p, id: uid() }; get().setPagosProveedor(prev => [n, ...prev]); get().enqueueMutation('addPagoProveedor', n); },
  updatePagoProveedor: (id, patch) => { get().setPagosProveedor(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updatePagoProveedor', { id, ...patch }); },
  deletePagoProveedor: (id) => { get().setPagosProveedor(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deletePagoProveedor', { id }); },

  addIncidente: (i) => { const n = { ...i, id: uid() }; get().setIncidentes(prev => [n, ...prev]); get().enqueueMutation('addIncidente', n); },
  updateIncidente: (id, patch) => { get().setIncidentes(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateIncidente', { id, ...patch }); },
  deleteIncidente: (id) => { get().setIncidentes(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteIncidente', { id }); },

  addDestajo: (d) => { const n = { ...d, id: uid() }; get().setDestajos(prev => [n, ...prev]); get().enqueueMutation('addDestajo', n); },
  updateDestajo: (id, patch) => { get().setDestajos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateDestajo', { id, ...patch }); },
  deleteDestajo: (id) => { get().setDestajos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteDestajo', { id }); },

  addRecepcion: (r) => { const n = { ...r, id: uid() }; get().setRecepciones(prev => [n, ...prev]); get().enqueueMutation('addRecepcion', n); },
  deleteRecepcion: (id) => { get().setRecepciones(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteRecepcion', { id }); },

  addPublicacionMuro: (p) => {
    const n = { ...p, id: uid(), createdAt: new Date().toISOString(), likes: 0, comentarios: [] };
    get().setPublicacionesMuro(prev => [n, ...prev]);
    get().enqueueMutation('addPublicacionMuro', n);
  },
  addComentarioMuro: (publicacionId, comentario) => {
    const c: ComentarioMuro = { ...comentario, id: uid(), createdAt: new Date().toISOString() };
    get().setPublicacionesMuro(prev => prev.map(p => p.id === publicacionId ? { ...p, comentarios: [...p.comentarios, c] } : p));
    get().enqueueMutation('addComentarioMuro', { publicacionId, comentario: c });
  },
  likePublicacionMuro: (id) => { get().setPublicacionesMuro(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p)); get().enqueueMutation('likePublicacionMuro', { id }); },

  addPrueba: (p) => { const n = { ...p, id: uid() }; get().setPruebas(prev => [n, ...prev]); get().enqueueMutation('addPrueba', n); },
  updatePrueba: (id, patch) => { get().setPruebas(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updatePrueba', { id, ...patch }); },
  deletePrueba: (id) => { get().setPruebas(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deletePrueba', { id }); },

  addNC: (n) => { const nc = { ...n, id: uid() }; get().setNcs(prev => [nc, ...prev]); get().enqueueMutation('addNC', nc); },
  updateNC: (id, patch) => { get().setNcs(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateNC', { id, ...patch }); },
  deleteNC: (id) => { get().setNcs(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteNC', { id }); },

  addLiberacion: (l) => { const n = { ...l, id: uid() }; get().setLiberaciones(prev => [n, ...prev]); get().enqueueMutation('addLiberacion', n); },
  updateLiberacion: (id, patch) => { get().setLiberaciones(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateLiberacion', { id, ...patch }); },
  deleteLiberacion: (id) => { get().setLiberaciones(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteLiberacion', { id }); },

  addNotificacion: (tipo, titulo, mensaje, proyectoId, referenciaId) => {
    get().setNotificaciones(prev => {
      const existing = proyectoId ? prev.find(n => n.proyectoId === proyectoId && n.titulo === titulo && !n.leido) : undefined;
      if (existing) return prev.map(n => n.id === existing.id ? { ...n, mensaje: `${n.mensaje} (+1)`, createdAt: new Date().toISOString(), referenciaId: referenciaId || n.referenciaId } : n);
      const nueva: Notificacion = { id: uid(), tipo: tipo as any, titulo, mensaje, proyectoId, referenciaId, leido: false, createdAt: new Date().toISOString() };
      get().enqueueMutation('addNotificacion', nueva);
      return [nueva, ...prev];
    });
  },
  markNotificacionLeida: (id) => { get().setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n)); get().enqueueMutation('markNotificacionLeida', { id, leido: true }); },
  deleteNotificacion: (id) => { get().setNotificaciones(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteNotificacion', { id }); },
  marcarTodasLeidas: () => {
    const unread = get().notificaciones.filter(n => !n.leido);
    get().setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    unread.forEach(n => get().enqueueMutation('markNotificacionLeida', { id: n.id, leido: true }));
  },
  verificarStockCritico: () => {
    const materiales = get().materiales;
    const critico = materiales.filter(m => m.stock <= 0);
    const bajo = materiales.filter(m => m.stock > 0 && m.stock <= (m.stockMinimo || 0));
    critico.forEach(m => get().addNotificacion('alerta', 'Stock Crítico', `${m.nombre}: sin stock`, m.proyectoIds?.[0], m.id));
    bajo.forEach(m => get().addNotificacion('alerta', 'Stock Bajo', `${m.nombre}: ${m.stock} unidades (mín: ${m.stockMinimo})`, m.proyectoIds?.[0], m.id));
  },

  verificarOrdenesCambioPendientes: () => {
    const ordenes = get().ordenesCambio;
    const pendientes = ordenes.filter(o => o.estado === 'pendiente');
    pendientes.forEach(o => {
      const proyecto = get().proyectos.find(p => p.id === o.proyectoId);
      get().addNotificacion('alerta', 'OC Pendiente', `Orden de cambio ${o.numero || o.id.slice(0,8)} pendiente de revisión — ${proyecto?.nombre || 'Sin proyecto'}`, o.proyectoId, o.id);
    });
  },

  verificarChecklistRechazado: () => {
    const ncs = get().ncs;
    const rechazadas = ncs.filter(nc => nc.estado === 'abierta' || nc.estado === 'rechazada');
    rechazadas.forEach(nc => {
      get().addNotificacion('alerta', 'NC Pendiente', `No conformidad: ${nc.descripcion?.slice(0, 60) || nc.id} — ${nc.estado}`, nc.proyectoId, nc.id);
    });
  },

  notifyAvanceRegistrado: (proyectoId: string, porcentaje: number) => {
    const proyecto = get().proyectos.find(p => p.id === proyectoId);
    if (proyecto) {
      get().addNotificacion('exito', 'Avance Registrado', `${proyecto.nombre}: avance físico ${porcentaje}%`, proyectoId);
    }
  },

  notifyDesviacionRendimiento: (proyectoId: string, tipo: string, mensaje: string) => {
    get().addNotificacion('alerta', `Desviación: ${tipo}`, mensaje, proyectoId);
  },

  avanceFinancieroCalculado: (proyectoId) => {
    const presupuesto = get().presupuestos.find(p => p.proyectoId === proyectoId);
    const totalP = presupuesto?.totalPresupuestado || presupuesto?.totalCalculado || 0;
    if (totalP <= 0) return 0;
    const cuentasPagar = get().cuentasPagar.filter(cp => cp.proyectoId === proyectoId);
    const totalPagado = cuentasPagar.reduce((acc, cp) => acc + (cp.monto || 0), 0);
    return Math.min(Math.round((totalPagado / totalP) * 100), 100);
  },
}));

