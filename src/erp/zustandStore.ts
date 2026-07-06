import { create } from 'zustand';
import { z } from 'zod';
import { sanitizarObjeto } from '@/lib/security';
import { safeLogger } from '@/lib/safeLogger';
import { supabase, hasServiceRole, getServiceClient } from '@/lib/supabase';
import { setEmpresaInfo, APP_SETTINGS_DEFAULTS, toSnake, toCamel, calculateSupplierPerformance, validateForeignKey as validateForeignKeyInArray } from './utils';
import { recordSyncMetric } from '@/lib/metrics';
import { logErrorFromException } from '@/lib/error-logger';
import { TABLE_MAP } from './constants/table-mappings';
import type {
  Proyecto, Movimiento, Empleado, Material, OrdenCompra, Proveedor, EventoCalendario, BitacoraEntry,
  Presupuesto, Licitacion, AvanceObra, ValeSalida, Notificacion, OrdenCambio, SeguimientoEVM,
  CuentaCobrar, CuentaPagar, Hito, Riesgo, PublicacionMuro, ComentarioMuro, PruebaLaboratorio,
  NoConformidad, LiberacionPartida, Plano, RFI, Submittal, ActivoHerramienta, CuadroComparativo,
  PagoProveedor, CotizacionCliente, VentaPaquete,   Destajo, RecepcionAlmacen, Incidente, Rol, CentroCosto, CalculoProyecto, InsumoBase,
  ReglaFactor, NormativaDepartamental, EscalaProduccion, Estacionalidad, HistorialAplicacionRegla,
} from './types';
import type { Plantilla } from './store/schemas/plantillas';
import type { ErrorLogEntry } from './store/schemas/errorLog';
import type { AppSettings, Mutation, LogAuditoria } from './types';
import type { ProyectoWeather } from './store/schemas/weather';
import type { ProjectProfitability, ClientProfitability, ResourceEfficiency, ProfitabilityTrend } from './store/schemas/profitability';

const RATE_LIMIT_MS = 100;
const lastMutationCall: Record<string, number> = {};
const callCounts: Record<string, number> = {};

export const resetRateLimit = () => { for (const k in lastMutationCall) delete lastMutationCall[k]; for (const k in callCounts) delete callCounts[k]; };

function checkRateLimit(type: string): boolean {
  const now = Date.now();
  const last = lastMutationCall[type];
  
  if (!last) {
    lastMutationCall[type] = now;
    callCounts[type] = 1;
    return true;
  }
  
  const elapsed = now - last;
  if (elapsed < RATE_LIMIT_MS) {
    const count = callCounts[type] || 0;
    if (count >= 5) {
      safeLogger.warn(`[RateLimit] ${type} bloqueada (demasiadas llamadas rápidas)`);
      return false;
    }
    callCounts[type] = count + 1;
    lastMutationCall[type] = now;
    return true;
  }
  
  lastMutationCall[type] = now;
  callCounts[type] = 1;
  return true;
}

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0>>(c==='x'?0:1)).toString(16));
}

function validateForeignKey<T extends { proyectoId?: string; proveedorId?: string }>(
  entity: T,
  entityName: string,
  proyectos: Proyecto[],
  proveedores?: Proveedor[]
): { valid: boolean; error?: string } {
  if (entity.proyectoId) {
    const proyecto = proyectos.find(p => p.id === entity.proyectoId);
    if (!proyecto) {
      return {
        valid: false,
        error: `${entityName}: proyectoId ${entity.proyectoId} no existe`
      };
    }
  }
  if (entity.proveedorId && proveedores) {
    const proveedor = proveedores.find(p => p.id === entity.proveedorId);
    if (!proveedor) {
      return {
        valid: false,
        error: `${entityName}: proveedorId ${entity.proveedorId} no existe`
      };
    }
  }
  return { valid: true };
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
  destajos: Destajo[]; calculosProyecto: CalculoProyecto[]; recepciones: RecepcionAlmacen[]; centrosCosto: CentroCosto[];
  plantillas: Plantilla[];
  insumosBase: InsumoBase[];
  projectProfitabilities: ProjectProfitability[];
  clientProfitabilities: ClientProfitability[];
  resourceEfficiencies: ResourceEfficiency[];
  profitabilityTrends: ProfitabilityTrend[];
  reglasFactores: ReglaFactor[]; normativasDepartamentales: NormativaDepartamental[];
  escalasProduccion: EscalaProduccion[]; estacionalidad: Estacionalidad[];
  historialReglas: HistorialAplicacionRegla[];
  mutationQueue: Mutation[]; syncMessage: string; syncCooldown: boolean; notificaciones: Notificacion[];
  auditLog: LogAuditoria[]; syncStatus: 'idle' | 'loading' | 'synced' | 'queued' | 'error';
  lastSyncedAt?: string; syncError?: string;
  isOnline: boolean; selectedProyectoId: string | null; appSettings: AppSettings;
  proyectoWeather: ProyectoWeather[];
  errorLogs: ErrorLogEntry[];
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
  setCalculosProyecto: (v: CalculoProyecto[] | ((prev: CalculoProyecto[]) => CalculoProyecto[])) => void;
  setRecepciones: (v: RecepcionAlmacen[] | ((prev: RecepcionAlmacen[]) => RecepcionAlmacen[])) => void;
  setCentrosCosto: (v: CentroCosto[] | ((prev: CentroCosto[]) => CentroCosto[])) => void;
  setPlantillas: (v: Plantilla[] | ((prev: Plantilla[]) => Plantilla[])) => void;
  setInsumosBase: (v: InsumoBase[] | ((prev: InsumoBase[]) => InsumoBase[])) => void;
  setProyectoWeather: (v: ProyectoWeather[] | ((prev: ProyectoWeather[]) => ProyectoWeather[])) => void;
  setErrorLogs: (v: ErrorLogEntry[] | ((prev: ErrorLogEntry[]) => ErrorLogEntry[])) => void;
  resolveError: (id: string, notes?: string) => void;
  deleteError: (id: string) => void;
  cleanupOldErrors: (daysOld?: number) => void;
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
  addNotificacion: (tipo: Notificacion['tipo'], titulo: string, mensaje: string, proyectoId?: string, referenciaId?: string) => void;
  markNotificacionLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  deleteNotificacion: (id: string) => void;
  verificarStockCritico: () => void;
  verificarOrdenesCambioPendientes: () => void;
  verificarChecklistRechazado: () => void;
  addCentroCosto: (c: Omit<CentroCosto, 'id'>) => void;
  updateCentroCosto: (id: string, patch: Partial<CentroCosto>) => void;
  deleteCentroCosto: (id: string) => void;
  deleteReglaFactor: (id: string) => void;
  deleteNormativaDepartamental: (id: string) => void;
  deleteEscalaProduccion: (id: string) => void;
  deleteEstacionalidad: (id: string) => void;
  setReglasFactores: (v: ReglaFactor[] | ((prev: ReglaFactor[]) => ReglaFactor[])) => void;
  setNormativasDepartamentales: (v: NormativaDepartamental[] | ((prev: NormativaDepartamental[]) => NormativaDepartamental[])) => void;
  setEscalasProduccion: (v: EscalaProduccion[] | ((prev: EscalaProduccion[]) => EscalaProduccion[])) => void;
  setEstacionalidad: (v: Estacionalidad[] | ((prev: Estacionalidad[]) => Estacionalidad[])) => void;
  addPlantilla: (p: Omit<Plantilla, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlantilla: (id: string, patch: Partial<Plantilla>) => void;
  deletePlantilla: (id: string) => void;
  clonarPlantilla: (plantillaId: string, nuevoNombre: string) => void;
  exportarPlantilla: (plantillaId: string) => string;
  importarPlantilla: (plantillaJson: string) => void;
  sugerirPlantillas: (caracteristicas: { tipologia?: string; cliente?: string; tipoObra?: string }) => Plantilla[];
  crearNuevaVersionPlantilla: (plantillaId: string, cambios: string, usuario?: string) => void;
  restaurarVersionPlantilla: (plantillaId: string, version: number) => void;
  crearProyectoDesdePlantilla: (plantillaId: string, proyectoData: Partial<Proyecto>) => void;
  actualizarMetricasPlantilla: (plantillaId: string) => void;
  actualizarMetricasTodasPlantillas: () => void;
  validarIntegridadPlantilla: (plantillaId: string) => { valido: boolean; errores: string[] };
  toggleFavoritoPlantilla: (plantillaId: string) => void;
  updateProyectoWeather: (proyectoId: string, weatherData: any, impact: any) => void;
  getProyectoWeather: (proyectoId: string) => ProyectoWeather | undefined;
  enqueueMutation: (type: string, payload: Record<string, any>) => string;
  addAuditEntry: (entry: Omit<LogAuditoria, 'id' | 'createdAt'>) => void;
  setAuditLog: (v: LogAuditoria[] | ((prev: LogAuditoria[]) => LogAuditoria[])) => void;
  getSupplierPerformance: (proveedorId: string) => any;
  getAllSupplierPerformance: (filtroProyectoId?: string) => any[];
  updateAvance: (id: string, patch: Partial<AvanceObra>) => void;
  updatePublicacionMuro: (id: string, patch: Partial<PublicacionMuro>) => void;
  deletePublicacionMuro: (id: string) => void;
  updateNotificacion: (id: string, patch: Partial<Notificacion>) => void;
  updateRecepcion: (id: string, patch: Partial<RecepcionAlmacen>) => void;
  updateVentaPaquete: (id: string, patch: Partial<VentaPaquete>) => void;
  deleteVentaPaquete: (id: string) => void;
  likePublicacionMuro: (publicacionId: string) => void;
  addError: (entry: Omit<ErrorLogEntry, "id" | "createdAt" | "updatedAt">) => void;
  duplicarCotizacion: (id: string) => void;
  addProyecto: (p: Omit<Proyecto, 'id'>) => void;
  updateProyecto: (id: string, patch: Partial<Proyecto>) => void;
  addMovimiento: (m: Omit<Movimiento, 'id'>) => void;
  updateMovimiento: (id: string, patch: Partial<Movimiento>) => void;
  deleteMovimiento: (id: string) => void;
  addEmpleado: (e: Omit<Empleado, 'id'>) => void;
  updateEmpleado: (id: string, patch: Partial<Empleado>) => void;
  deleteEmpleado: (id: string) => void;
  addMaterial: (m: Omit<Material, 'id'>) => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  addOrden: (o: Omit<OrdenCompra, 'id'>) => void;
  updateOrden: (id: string, patch: Partial<OrdenCompra>) => void;
  addProveedor: (p: Omit<Proveedor, 'id'>) => void;
  updateProveedor: (id: string, patch: Partial<Proveedor>) => void;
  deleteProveedor: (id: string) => void;
  addEvento: (e: Omit<EventoCalendario, 'id'>) => void;
  updateEvento: (id: string, patch: Partial<EventoCalendario>) => void;
  deleteEvento: (id: string) => void;
  addBitacora: (b: Omit<BitacoraEntry, 'id'>) => void;
  updateBitacora: (id: string, patch: Partial<BitacoraEntry>) => void;
  deleteBitacora: (id: string) => void;
  addPresupuesto: (p: Omit<Presupuesto, 'id'>) => void;
  updatePresupuesto: (id: string, patch: Partial<Presupuesto>) => void;
  deletePresupuesto: (id: string) => void;
  addLicitacion: (l: Omit<Licitacion, 'id'>) => void;
  updateLicitacion: (id: string, patch: Partial<Licitacion>) => void;
  deleteLicitacion: (id: string) => void;
  addCotizacion: (c: Omit<CotizacionCliente, 'id'>) => void;
  updateCotizacion: (id: string, patch: Partial<CotizacionCliente>) => void;
  deleteCotizacion: (id: string) => void;
  addAvance: (a: Omit<AvanceObra, 'id'>) => void;
  deleteAvance: (id: string) => void;
  addSeguimiento: (s: Omit<SeguimientoEVM, 'id'>) => void;
  updateSeguimiento: (id: string, patch: Partial<SeguimientoEVM>) => void;
  deleteSeguimiento: (id: string) => void;
  updateValeSalida: (id: string, patch: Partial<ValeSalida>) => void;
  addValeSalida: (v: Omit<ValeSalida, 'id'>) => void;
  deleteValeSalida: (id: string) => void;
  addCuentaCobrar: (c: Omit<CuentaCobrar, 'id'>) => void;
  updateCuentaCobrar: (id: string, patch: Partial<CuentaCobrar>) => void;
  deleteCuentaCobrar: (id: string) => void;
  addCuentaPagar: (c: Omit<CuentaPagar, 'id'>) => void;
  updateCuentaPagar: (id: string, patch: Partial<CuentaPagar>) => void;
  deleteCuentaPagar: (id: string) => void;
  addOrdenCambio: (o: Omit<OrdenCambio, 'id'>) => void;
  updateOrdenCambio: (id: string, patch: Partial<OrdenCambio>) => void;
  deleteOrdenCambio: (id: string) => void;
  addHito: (h: Omit<Hito, 'id'>) => void;
  updateHito: (id: string, patch: Partial<Hito>) => void;
  deleteHito: (id: string) => void;
  addRiesgo: (r: Omit<Riesgo, 'id'>) => void;
  updateRiesgo: (id: string, patch: Partial<Riesgo>) => void;
  deleteRiesgo: (id: string) => void;
  addPlano: (p: Omit<Plano, 'id'>) => void;
  updatePlano: (id: string, patch: Partial<Plano>) => void;
  deletePlano: (id: string) => void;
  addRfi: (r: Omit<RFI, 'id'>) => void;
  updateRfi: (id: string, patch: Partial<RFI>) => void;
  deleteRfi: (id: string) => void;
  addSubmittal: (s: Omit<Submittal, 'id'>) => void;
  updateSubmittal: (id: string, patch: Partial<Submittal>) => void;
  deleteSubmittal: (id: string) => void;
  addActivo: (a: Omit<ActivoHerramienta, 'id'>) => void;
  updateActivo: (id: string, patch: Partial<ActivoHerramienta>) => void;
  deleteActivo: (id: string) => void;
  addCuadro: (c: Omit<CuadroComparativo, 'id'>) => void;
  updateCuadro: (id: string, patch: Partial<CuadroComparativo>) => void;
  deleteCuadro: (id: string) => void;
  addPagoProveedor: (p: Omit<PagoProveedor, 'id'>) => void;
  updatePagoProveedor: (id: string, patch: Partial<PagoProveedor>) => void;
  deletePagoProveedor: (id: string) => void;
  addIncidente: (i: Omit<Incidente, 'id'>) => void;
  updateIncidente: (id: string, patch: Partial<Incidente>) => void;
  deleteIncidente: (id: string) => void;
  addDestajo: (d: Omit<Destajo, 'id'>) => void;
  updateDestajo: (id: string, patch: Partial<Destajo>) => void;
  deleteDestajo: (id: string) => void;
  addInsumoBase: (i: Omit<InsumoBase, 'id'>) => void;
  updateInsumoBase: (id: string, patch: Partial<InsumoBase>) => void;
  deleteInsumoBase: (id: string) => void;
  addCalculoProyecto: (d: Omit<CalculoProyecto, 'id'>) => void;
  updateCalculoProyecto: (id: string, patch: Partial<CalculoProyecto>) => void;
  deleteCalculoProyecto: (id: string) => void;
  addRecepcion: (r: Omit<RecepcionAlmacen, 'id'>) => void;
  deleteRecepcion: (id: string) => void;
  addPublicacionMuro: (p: Omit<PublicacionMuro, 'id'>) => void;
  updatePublicacionMuro: (id: string, patch: Partial<PublicacionMuro>) => void;
  addComentarioMuro: (publicacionId: string, comentario: Omit<ComentarioMuro, 'id' | 'createdAt'>) => void;
  addPrueba: (p: Omit<PruebaLaboratorio, 'id'>) => void;
  updatePrueba: (id: string, patch: Partial<PruebaLaboratorio>) => void;
  deletePrueba: (id: string) => void;
  addNC: (nc: Omit<NoConformidad, 'id'>) => void;
  updateNC: (id: string, patch: Partial<NoConformidad>) => void;
  deleteNC: (id: string) => void;
  addLiberacion: (l: Omit<LiberacionPartida, 'id'>) => void;
  updateLiberacion: (id: string, patch: Partial<LiberacionPartida>) => void;
  deleteLiberacion: (id: string) => void;
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
  const startTime = performance.now();
  try {
    useErpStore.setState({ syncStatus: 'loading', syncError: undefined });
    if (!supabase) {
      safeLogger.warn('[fetchInitialData] Supabase no configurado - Modo offline local');
      useErpStore.setState({ 
        syncStatus: 'idle', 
        syncError: undefined,
        lastSyncedAt: new Date().toISOString() 
      });
      const duration = performance.now() - startTime;
      recordSyncMetric(duration, false, 0);
      return false;
    }

    const CRITICAL_TABLES = [
      'erp_proyectos','erp_movimientos','erp_empleados','erp_materiales',
      'erp_ordenes_compra','erp_proveedores','erp_presupuestos','erp_avances',
    ] as const;

    const SECONDARY_TABLES = [
      'erp_cuentas_cobrar','erp_cuentas_pagar','erp_ordenes_cambio',
      'erp_hitos','erp_riesgos','erp_licitaciones','erp_cotizaciones_negocio',
      'erp_vales_salida','erp_no_conformidades','erp_incidentes',
      'erp_publicaciones_muro','erp_planos',
      'erp_rfis','erp_submittals','erp_activos',
      'erp_eventos_calendario','erp_bitacora','erp_seguimiento',
      'erp_liberaciones_partida','erp_notificaciones','erp_cuadros',
      'erp_pruebas_laboratorio','ventas_paquetes',
      'erp_plantillas_proyectos',
      'erp_destajos','erp_recepciones','erp_pagos_proveedor',
      'erp_centros_costo','erp_error_logs','erp_insumos_base',
      'erp_proyecto_weather',
    ] as const;

    const isGuestMode = hasServiceRole && !localStorage.getItem('sb-neygzluxugodiwcuctbj-auth-token');
    let serviceRoleFailed = false;

    const fetchTable = async (table: string) => {
      if (isGuestMode && !serviceRoleFailed) {
        const svcClient = getServiceClient();
        const { data: svcData, error: svcError } = await svcClient.from(table).select('*').limit(1);
        if (!svcError) {
          const { data: allData } = await svcClient.from(table).select('*');
          return { table, data: (allData || []).map(normalizarFilaSupabase) };
        }
        serviceRoleFailed = true;
        safeLogger.warn(`[fetchInitialData] service_role falló (${svcError.message}), usando anon`);
      }
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        safeLogger.warn(`[fetchInitialData] Error en ${table}: ${error.message}`);
        return null;
      }
      return { table, data: (data || []).map(normalizarFilaSupabase) };
    };

    const processResults = (results: PromiseSettledResult<{ table: string; data: any[] } | null>[]) => {
      const statePatch: Record<string, any> = {};
      let errorCount = 0;
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const { table, data } = result.value;
          const stateKey = TABLE_MAP[table];
          if (stateKey) statePatch[stateKey] = data;
        } else {
          errorCount++;
        }
      }
      return { statePatch, errorCount };
    };

    const criticalResults = await Promise.allSettled(CRITICAL_TABLES.map(fetchTable));
    const { statePatch: criticalPatch, errorCount: criticalErrors } = processResults(criticalResults);

    if (Object.keys(criticalPatch).length > 0) {
      useErpStore.setState({ 
        ...criticalPatch, 
        syncStatus: 'synced', 
        lastSyncedAt: new Date().toISOString(), 
        syncError: criticalErrors > 0 ? `${criticalErrors} tablas críticas fallaron pero otras cargaron correctamente` : undefined 
      });
      safeLogger.log(`[fetchInitialData] Cargados datos críticos de ${Object.keys(criticalPatch).length} tablas desde Supabase`);
    }

    setTimeout(async () => {
      const secondaryResults = await Promise.allSettled(SECONDARY_TABLES.map(fetchTable));
      const { statePatch: secondaryPatch, errorCount: secondaryErrors } = processResults(secondaryResults);

      if (Object.keys(secondaryPatch).length > 0) {
        useErpStore.setState(secondaryPatch);
        safeLogger.log(`[fetchInitialData] Cargados datos secundarios de ${Object.keys(secondaryPatch).length} tablas desde Supabase`);
        const totalErrors = criticalErrors + secondaryErrors;
        if (totalErrors > 0) {
          useErpStore.setState({ 
            syncError: `${totalErrors} tablas fallaron pero otras cargaron correctamente` 
          });
        }
      }
    }, 100);

    if (Object.keys(criticalPatch).length > 0) {
      const duration = performance.now() - startTime;
      recordSyncMetric(duration, true, CRITICAL_TABLES.length);
      (window as any).__FETCH_RETRY = 0;
      return true;
    }
    
    useErpStore.setState({ 
      syncStatus: 'error', 
      syncError: 'No se pudieron cargar datos críticos. Verifique la conexión a Supabase.',
      lastSyncedAt: new Date().toISOString() 
    });
    const duration = performance.now() - startTime;
    recordSyncMetric(duration, false, 0);
    (window as any).__FETCH_RETRY = 0;
    return false;
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    useErpStore.setState({ syncStatus: 'error', syncError: error });
    safeLogger.warn('[fetchInitialData] Error general:', err);
    const duration = performance.now() - startTime;
    recordSyncMetric(duration, false, 0);
    const next = (window as any).__FETCH_RETRY || 0;
    (window as any).__FETCH_RETRY = next + 1;
    if (attempt > 10) {
      safeLogger.warn('[fetchInitialData] Max retries exceeded, giving up');
      useErpStore.setState({ 
        syncStatus: 'error', 
        syncError: 'Error de conexión tras múltiples reintentos. Revise su conexión o configure Supabase correctamente.' 
      });
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
  rfis: [], submittals: [], activos: [], cuadros: [], pagosProveedor: [],   destajos: [], calculosProyecto: [],
    recepciones: [], centrosCosto: [],   plantillas: [],
  insumosBase: [],
  mutationQueue: [], syncMessage: '', syncCooldown: false, syncStatus: 'idle',
  notificaciones: [],
  auditLog: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  selectedProyectoId: null,
  appSettings: APP_SETTINGS_DEFAULTS,
  proyectoWeather: [],
  errorLogs: [],

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
  setCalculosProyecto: (v) => set(typeof v === 'function' ? { calculosProyecto: v(get().calculosProyecto) } : { calculosProyecto: v }),
  setRecepciones: (v) => set(typeof v === 'function' ? { recepciones: v(get().recepciones) } : { recepciones: v }),
  setCentrosCosto: (v) => set(typeof v === 'function' ? { centrosCosto: v(get().centrosCosto) } : { centrosCosto: v }),
  setPlantillas: (v) => set(typeof v === 'function' ? { plantillas: v(get().plantillas) } : { plantillas: v }),
  setInsumosBase: (v) => set(typeof v === 'function' ? { insumosBase: v(get().insumosBase) } : { insumosBase: v }),
  setProyectoWeather: (v) => set(typeof v === 'function' ? { proyectoWeather: v(get().proyectoWeather) } : { proyectoWeather: v }),
  setErrorLogs: (v) => set(typeof v === 'function' ? { errorLogs: v(get().errorLogs) } : { errorLogs: v }),
  resolveError: (id, notes) => {
    set(s => ({
      errorLogs: s.errorLogs.map(e =>
        e.id === id
          ? { ...e, resolved: true, resolvedAt: new Date().toISOString(), resolutionNotes: notes || e.resolutionNotes }
          : e
      )
    }));
    get().enqueueMutation('resolveError', { id, resolutionNotes: notes });
  },
  deleteError: (id) => {
    set(s => ({ errorLogs: s.errorLogs.filter(e => e.id !== id) }));
    get().enqueueMutation('deleteError', { id });
  },
  cleanupOldErrors: (daysOld = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    set(s => ({
      errorLogs: s.errorLogs.filter(e => new Date(e.createdAt) > cutoff)
    }));
    get().enqueueMutation('cleanupOldErrors', { daysOld });
  },
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
    if (!safePayload.created_at && (type.startsWith('add') || type === 'clonarPlantilla')) {
      safePayload.created_at = new Date().toISOString();
    }
    if (!safePayload.updated_at && (type.startsWith('update') || type.startsWith('add'))) {
      safePayload.updated_at = new Date().toISOString();
    }
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
    const n = { ...p, id: uid(), version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Proyecto;
    get().setProyectos(prev => [n, ...prev]);
    get().enqueueMutation('addProyecto', n);
    get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'crear', entidad: 'proyecto', entidadId: n.id, valoresNuevos: { nombre: n.nombre, estado: n.estado, presupuestoTotal: n.presupuestoTotal } });
  },
  updateProyecto: (id, patch) => {
    try {
      const proyecto = get().proyectos.find(p => p.id === id);
      if (!proyecto) return;
      const oldEstado = proyecto.estado; const newEstado = patch.estado || oldEstado;
      const transicionesValidas: Record<string, string[]> = { planeacion: ['ejecucion'], ejecucion: ['pausado','finalizado'], pausado: ['ejecucion'], finalizado: [] };
      if (oldEstado !== newEstado && !transicionesValidas[oldEstado]?.includes(newEstado)) { return; }
      if (newEstado === 'ejecucion' && oldEstado === 'planeacion') {
        const tienePresupuesto = get().presupuestos.some(p => p.proyectoId === id && p.estado === 'aprobado');
        const tieneHitos = get().hitos.some(h => h.proyectoId === id);
        if (!tienePresupuesto) { return; }
        if (!tieneHitos) { return; }
      }
      if (newEstado === 'pausado' && !patch.motivoPausa) { return; }
      if (newEstado === 'finalizado' && oldEstado === 'ejecucion') {
        const current = get().proyectos.find(p => p.id === id);
        if (current && (current.avanceFisico < 100 || current.avanceFinanciero < 100)) { return; }
      }
      const etapaValida: Record<string, string[]> = { planeacion: ['planificacion','diseno','preconstruccion'], ejecucion: ['construccion'], pausado: ['planificacion','diseno','preconstruccion','construccion','cierre'], finalizado: ['cierre'] };
      if (newEstado && patch.etapa && !etapaValida[newEstado]?.includes(patch.etapa)) { return; }
      if (oldEstado === 'planeacion' && (patch.avanceFisico && patch.avanceFisico > 0)) { return; }
      if (oldEstado === 'planeacion' && (patch.avanceFinanciero && patch.avanceFinanciero > 0)) { return; }
      if (newEstado === 'finalizado') patch = { ...patch, avanceFisico: 100, avanceFinanciero: 100 };
      const expectedVersion = proyecto.version || 1;
      if (patch.version !== undefined && patch.version < expectedVersion) { return; }
      patch.version = expectedVersion + 1;
      get().setProyectos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
      get().enqueueMutation('updateProyecto', { id, ...patch });
      if (oldEstado !== newEstado) {
        get().addAuditEntry({ usuarioNombre: 'sistema', accion: `cambio_estado: ${oldEstado} → ${newEstado}`, entidad: 'proyecto', entidadId: id, valoresAnteriores: { estado: oldEstado, avanceFisico: proyecto.avanceFisico }, valoresNuevos: { estado: newEstado, ...(patch.motivoPausa ? { motivoPausa: patch.motivoPausa } : {}) } });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logErrorFromException(error, {
        component: 'zustandStore',
        function_name: 'updateProyecto',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: id,
        additional_context: { patch }
      });
    }
  },
  deleteProyecto: (id) => {
    const p = get().proyectos.find(x => x.id === id);
    if (!p) {
      safeLogger.warn('[deleteProyecto] Proyecto no encontrado:', id);
      return;
    }
    get().setProyectos(prev => prev.filter(p => p.id !== id));
    get().enqueueMutation('deleteProyecto', { id });
    get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'eliminar', entidad: 'proyecto', entidadId: id, valoresAnteriores: { nombre: p.nombre, estado: p.estado } });
  },
  clearProyectos: () => {
    const ids = get().proyectos.map(p => p.id);
    if (ids.length === 0) return;
    const nombres = get().proyectos.map(p => p.nombre);
    get().setProyectos([]);
    if (ids.includes(get().selectedProyectoId || '')) get().setSelectedProyectoId(null);
    ids.forEach(id => {
      get().enqueueMutation('deleteProyecto', { id });
    });
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
    get().setCalculosProyecto([]);
    get().setRecepciones([]);
    get().setCentrosCosto([]);
    get().setPlantillas([]);
    get().setInsumosBase([]);
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

  addMovimiento: (m) => {
    const validation = validateForeignKey(m, 'Movimiento', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addMovimiento'), {
        component: 'zustandStore',
        function_name: 'addMovimiento',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: m.proyectoId,
        additional_context: { movimiento: m }
      });
      return;
    }
    const n = { ...m, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    get().setMovimientos(prev => [n, ...prev]);
    get().enqueueMutation('addMovimiento', n);
  },
  updateMovimiento: (id, patch) => { get().setMovimientos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateMovimiento', { id, ...patch }); },
  deleteMovimiento: (id) => { get().setMovimientos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteMovimiento', { id }); },

  addEmpleado: (e) => {
    const validation = validateForeignKey(e, 'Empleado', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addEmpleado'), {
        component: 'zustandStore',
        function_name: 'addEmpleado',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: e.proyectoId,
        additional_context: { empleado: e }
      });
      return;
    }
    const n = { ...e, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    get().setEmpleados(prev => [n, ...prev]);
    get().enqueueMutation('addEmpleado', n);
  },
  updateEmpleado: (id, patch) => { get().setEmpleados(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateEmpleado', { id, ...patch }); },
  deleteEmpleado: (id) => { get().setEmpleados(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteEmpleado', { id }); },

  addMaterial: (m) => {
    const validation = validateForeignKey(m, 'Material', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addMaterial'), {
        component: 'zustandStore',
        function_name: 'addMaterial',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: m.proyectoId,
        additional_context: { material: m }
      });
      return;
    }
    const n = { ...m, id: uid(), version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Material;
    get().setMateriales(prev => [n, ...prev]);
    get().enqueueMutation('addMaterial', n);
  },
  updateMaterial: (id, patch) => {
    const existing = get().materiales.find(m => m.id === id);
    if (existing) {
      const expectedVersion = existing.version || 1;
      if (patch.version !== undefined && patch.version < expectedVersion) { return; }
      patch.version = expectedVersion + 1;
    }
    get().setMateriales(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateMaterial', { id, ...patch });
  },
  deleteMaterial: (id) => { get().setMateriales(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteMaterial', { id }); },

  addOrden: (o) => {
    const validation = validateForeignKey(o, 'Orden', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addOrden'), {
        component: 'zustandStore',
        function_name: 'addOrden',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: o.proyectoId,
        additional_context: { orden: o }
      });
      return;
    }
    const n = { ...o, id: uid(), version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as OrdenCompra;
    get().setOrdenes(prev => [n, ...prev]);
    get().enqueueMutation('addOrden', n);
  },
  updateOrden: (id, patch) => {
    try {
      const orden = get().ordenes.find(o => o.id === id);
      if (!orden) return;
      const expectedVersion = orden.version || 1;
      get().setOrdenes(prev => prev.map(p => p.id === id ? { ...p, ...patch, version: expectedVersion + 1 } : p));
      const newEstado = patch.estado || orden.estado;
      if ((newEstado === 'aprobado' || newEstado === 'recibida') && orden?.items && !orden.stockActualizado) {
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
      get().enqueueMutation('updateOrden', { id, ...patch, stockActualizado: true });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logErrorFromException(error, {
        component: 'zustandStore',
        function_name: 'updateOrden',
        error_type: 'validation',
        severity: 'error',
        additional_context: { ordenId: id, patch }
      });
    }
  },
  deleteOrden: (id) => { get().setOrdenes(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteOrden', { id }); },

  addProveedor: (p) => { const n = { ...p, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; get().setProveedores(prev => [n, ...prev]); get().enqueueMutation('addProveedor', n); },
  updateProveedor: (id, patch) => { get().setProveedores(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateProveedor', { id, ...patch }); },
  deleteProveedor: (id) => { get().setProveedores(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteProveedor', { id }); },

  addEvento: (e) => {
    const validation = validateForeignKey(e, 'Evento', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addEvento'), {
        component: 'zustandStore',
        function_name: 'addEvento',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: e.proyectoId,
        additional_context: { evento: e }
      });
      return;
    }
    const n = { ...e, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    get().setEventos(prev => [n, ...prev]);
    get().enqueueMutation('addEvento', n);
  },
  updateEvento: (id, patch) => { get().setEventos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateEvento', { id, ...patch }); },
  deleteEvento: (id) => { get().setEventos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteEvento', { id }); },

  addBitacora: (b) => {
    const validation = validateForeignKey(b, 'Bitacora', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addBitacora'), {
        component: 'zustandStore',
        function_name: 'addBitacora',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: b.proyectoId,
        additional_context: { bitacora: b }
      });
      return;
    }
    const n = { ...b, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    get().setBitacora(prev => [n, ...prev]);
    get().enqueueMutation('addBitacora', n);
  },
  updateBitacora: (id, patch) => { get().setBitacora(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateBitacora', { id, ...patch }); },
  deleteBitacora: (id) => { get().setBitacora(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteBitacora', { id }); },

  addPresupuesto: (p) => {
    const validation = validateForeignKey(p, 'Presupuesto', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addPresupuesto'), {
        component: 'zustandStore',
        function_name: 'addPresupuesto',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: p.proyectoId,
        additional_context: { presupuesto: p }
      });
      return;
    }
    const n = { ...p, id: uid(), version: 1 } as Presupuesto;
    get().setPresupuestos(prev => [n, ...prev]);
    get().enqueueMutation('addPresupuesto', n);
  },
  updatePresupuesto: (id, patch) => {
    const existing = get().presupuestos.find(p => p.id === id);
    if (!existing) return;
    const expectedVersion = existing.version || 1;
    if (patch.version !== undefined && patch.version < expectedVersion) { return; }
    let totalCalc = patch.totalCalculado;
    if (patch.renglones) {
      totalCalc = patch.renglones.reduce((acc, r) => acc + (r.totalPV ?? (r.costoMateriales + r.costoManoObra + r.costoEquipo || 0)), 0);
    }
    patch.version = expectedVersion + 1;
    patch.totalCalculado = totalCalc ?? existing.totalCalculado;
    const cambios: Record<string, { anterior: unknown; nuevo: unknown }> = {};
    if (patch.totalCalculado !== undefined && patch.totalCalculado !== existing.totalCalculado) cambios.totalCalculado = { anterior: existing.totalCalculado, nuevo: patch.totalCalculado };
    if (patch.estado !== undefined && patch.estado !== existing.estado) cambios.estado = { anterior: existing.estado, nuevo: patch.estado };
    if (patch.renglones && patch.renglones.length !== (existing.renglones?.length || 0)) cambios.renglones = { anterior: (existing.renglones?.length || 0), nuevo: patch.renglones.length };
    get().setPresupuestos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
    get().enqueueMutation('updatePresupuesto', { id, ...patch });
    if (Object.keys(cambios).length > 0) {
      get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'actualizar_presupuesto', entidad: 'presupuesto', entidadId: id, valoresAnteriores: Object.fromEntries(Object.entries(cambios).map(([k, v]) => [k, v.anterior])), valoresNuevos: Object.fromEntries(Object.entries(cambios).map(([k, v]) => [k, v.nuevo])) });
    }
  },
  deletePresupuesto: (id) => { get().setPresupuestos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deletePresupuesto', { id }); },
  getPresupuestoByProyecto: (proyectoId) => get().presupuestos.find(p => p.proyectoId === proyectoId),

  addLicitacion: (l) => { const n = { ...l, id: uid() }; get().setLicitaciones(prev => [n, ...prev]); get().enqueueMutation('addLicitacion', n); },
  updateLicitacion: (id, patch) => { get().setLicitaciones(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateLicitacion', { id, ...patch }); },
  deleteLicitacion: (id) => { get().setLicitaciones(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteLicitacion', { id }); },

  addCotizacion: (c) => {
    const validation = validateForeignKey(c, 'Cotizacion', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId/proveedorId inválido en addCotizacion'), {
        component: 'zustandStore',
        function_name: 'addCotizacion',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: c.proyectoId,
        additional_context: { cotizacion: c }
      });
      return;
    }
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

  addAvance: (a) => {
    const validation = validateForeignKey(a, 'Avance', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addAvance'), {
        component: 'zustandStore',
        function_name: 'addAvance',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: a.proyectoId,
        additional_context: { avance: a }
      });
      return;
    }
    const n = { ...a, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    get().setAvances(prev => [n, ...prev]);
    get().enqueueMutation('addAvance', n);
  },
  deleteAvance: (id) => { get().setAvances(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteAvance', { id }); },

  addSeguimiento: (s) => { const n = { ...s, id: uid() }; get().setSeguimientoEVM(prev => [n, ...prev]); get().enqueueMutation('addSeguimiento', n); },
  updateSeguimiento: (id, patch) => { get().setSeguimientoEVM(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateSeguimiento', { id, ...patch }); },
  deleteSeguimiento: (id) => { get().setSeguimientoEVM(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteSeguimiento', { id }); },

  updateValeSalida: (id, patch) => { get().setValesSalida(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateValeSalida', { id, ...patch }); },
  addValeSalida: (v) => {
    const n = { ...v, id: uid() };
    const ids = (n.items || []).filter(i => i.materialId).map(i => i.materialId);
    if (ids.length) {
      get().setMateriales(prev => prev.map(m => {
        if (!ids.includes(m.id)) return m;
        const linea = n.items.find(i => i.materialId === m.id);
        const cantidad = linea?.cantidad ?? 0;
        return { ...m, stock: Math.max(0, m.stock - cantidad), version: (m.version || 1) + 1 };
      }));
    }
    get().setValesSalida(prev => [n, ...prev]);
    get().enqueueMutation('addValeSalida', n);
  },
  deleteValeSalida: (id) => { get().setValesSalida(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteValeSalida', { id }); },

  addCuentaCobrar: (c) => { const n = { ...c, id: uid() }; get().setCuentasCobrar(prev => [n, ...prev]); get().enqueueMutation('addCuentaCobrar', n); },
  updateCuentaCobrar: (id, patch) => { get().setCuentasCobrar(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateCuentaCobrar', { id, ...patch }); },
  deleteCuentaCobrar: (id) => { get().setCuentasCobrar(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteCuentaCobrar', { id }); },

  addCuentaPagar: (c) => { const n = { ...c, id: uid() }; get().setCuentasPagar(prev => [n, ...prev]); get().enqueueMutation('addCuentaPagar', n); },
  updateCuentaPagar: (id, patch) => { get().setCuentasPagar(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateCuentaPagar', { id, ...patch }); },
  deleteCuentaPagar: (id) => { get().setCuentasPagar(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteCuentaPagar', { id }); },

  addOrdenCambio: (o) => { const n = { ...o, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; get().setOrdenesCambio(prev => [n, ...prev]); get().enqueueMutation('addOrdenCambio', n); },
  updateOrdenCambio: (id, patch) => { get().setOrdenesCambio(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateOrdenCambio', { id, ...patch }); },
  deleteOrdenCambio: (id) => { get().setOrdenesCambio(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteOrdenCambio', { id }); },

  addHito: (h) => {
    const validation = validateForeignKey(h, 'Hito', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addHito'), {
        component: 'zustandStore',
        function_name: 'addHito',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: h.proyectoId,
        additional_context: { hito: h }
      });
      return;
    }
    const n = { ...h, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    get().setHitos(prev => [n, ...prev]);
    get().enqueueMutation('addHito', n);
  },
  updateHito: (id, patch) => { get().setHitos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateHito', { id, ...patch }); },
  deleteHito: (id) => { get().setHitos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteHito', { id }); },

  addRiesgo: (r) => {
    const validation = validateForeignKey(r, 'Riesgo', get().proyectos, get().proveedores);
    if (!validation.valid) {
      safeLogger.error(validation.error);
      logErrorFromException(new Error(validation.error || 'proyectoId inválido en addRiesgo'), {
        component: 'zustandStore',
        function_name: 'addRiesgo',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: r.proyectoId,
        additional_context: { riesgo: r }
      });
      return;
    }
    const n = { ...r, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    get().setRiesgos(prev => [n, ...prev]);
    get().enqueueMutation('addRiesgo', n);
  },
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

  addCentroCosto: (c) => { const n = { ...c, id: uid() }; get().setCentrosCosto(prev => [n, ...prev]); get().enqueueMutation('addCentroCosto', n); },
  updateCentroCosto: (id, patch) => { get().setCentrosCosto(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateCentroCosto', { id, ...patch }); },
  deleteCentroCosto: (id) => { get().setCentrosCosto(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteCentroCosto', { id }); },

  addDestajo: (d) => { const n = { ...d, id: uid() }; get().setDestajos(prev => [n, ...prev]); get().enqueueMutation('addDestajo', n); },
  updateDestajo: (id, patch) => { get().setDestajos(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateDestajo', { id, ...patch }); },
  deleteDestajo: (id) => { get().setDestajos(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteDestajo', { id }); },

  addInsumoBase: (i) => { const n = { ...i, id: uid() }; get().setInsumosBase(prev => [n, ...prev]); get().enqueueMutation('addInsumoBase', n); },
  updateInsumoBase: (id, patch) => { get().setInsumosBase(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateInsumoBase', { id, ...patch }); },
  deleteInsumoBase: (id) => { get().setInsumosBase(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteInsumoBase', { id }); },

  addCalculoProyecto: (d) => { const n = { ...d, id: uid() }; get().setCalculosProyecto(prev => [n, ...prev]); get().enqueueMutation('addCalculoProyecto', n); },
  updateCalculoProyecto: (id, patch) => { get().setCalculosProyecto(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p)); get().enqueueMutation('updateCalculoProyecto', { id, ...patch }); },
  deleteCalculoProyecto: (id) => { get().setCalculosProyecto(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteCalculoProyecto', { id }); },

  addRecepcion: (r) => { const n = { ...r, id: uid() }; get().setRecepciones(prev => [n, ...prev]); get().enqueueMutation('addRecepcion', n); },
  deleteRecepcion: (id) => { get().setRecepciones(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteRecepcion', { id }); },

  addPublicacionMuro: (p) => {
    const n = { ...p, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), likes: 0, comentarios: [] };
    get().setPublicacionesMuro(prev => [n, ...prev]);
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
    if (proyectoId && !validateForeignKeyInArray(proyectoId, get().proyectos, 'proyecto')) {
      safeLogger.error('[FK Validation] proyectoId inválido en addNotificacion');
      logErrorFromException(new Error('proyectoId inválido en addNotificacion'), {
        component: 'zustandStore',
        function_name: 'addNotificacion',
        error_type: 'validation',
        severity: 'warning',
        proyecto_id: proyectoId,
        additional_context: { tipo, titulo, mensaje }
      });
      return;
    }
    get().setNotificaciones(prev => {
      const existing = proyectoId ? prev.find(n => n.proyectoId === proyectoId && n.titulo === titulo && !n.leido) : undefined;
      if (existing) return prev.map(n => n.id === existing.id ? { ...n, mensaje: `${n.mensaje} (+1)`, createdAt: new Date().toISOString(), referenciaId: referenciaId || n.referenciaId } : n);
      const nueva: Notificacion = { id: uid(), tipo, titulo, mensaje, proyectoId, referenciaId, leido: false, createdAt: new Date().toISOString() };
      get().enqueueMutation('addNotificacion', nueva);
      return [nueva, ...prev];
    });
  },
  markNotificacionLeida: (id) => { get().setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n)); get().enqueueMutation('markNotificacionLeida', { id, leido: true }); },
  deleteNotificacion: (id) => { get().setNotificaciones(prev => prev.filter(p => p.id !== id)); get().enqueueMutation('deleteNotificacion', { id }); },
  marcarTodasLeidas: () => {
    const unread = get().notificaciones.filter(n => !n.leido);
    get().setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
    const mutations: Mutation[] = unread.map(n => ({
      id: uid(), type: 'markNotificacionLeida', payload: toSnake(sanitizarObjeto({ id: n.id, leido: true })), timestamp: Date.now(), retryCount: 0,
    }));
    if (mutations.length === 0) return;
    get().setMutationQueue(q => { const trimmed = q.length + mutations.length >= 100 ? q.slice(mutations.length) : q; return [...trimmed, ...mutations]; });
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

  actualizarMetricasPlantilla: (plantillaId: string) => {
    const plantilla = get().plantillas.find(p => p.id === plantillaId);
    if (!plantilla || !plantilla.metricas) return;

    const proyectoIds = plantilla.metricas.proyectoIds || [];
    const proyectos = get().proyectos.filter(p => proyectoIds.includes(p.id));

    const proyectosCompletados = proyectos.filter(p => p.estado === 'finalizado').length;
    const proyectosActivos = proyectos.filter(p => p.estado === 'ejecucion').length;
    const proyectosPausados = proyectos.filter(p => p.estado === 'pausado').length;

    const avgAvance = proyectos.length > 0 ? proyectos.reduce((sum, p) => sum + (p.avanceFisico || 0), 0) / proyectos.length : 0;

    const proyectosConMargen = proyectos.filter(p => p.margenUtilidadObjetivo !== undefined);
    const avgMargen = proyectosConMargen.length > 0 ? proyectosConMargen.reduce((sum, p) => sum + (p.margenUtilidadObjetivo || 0), 0) / proyectosConMargen.length : 0;

    const exitoPromedio = proyectoIds.length > 0 ? ((proyectosCompletados / proyectoIds.length) * 100) : 50;

    const updatedMetricas = {
      ...plantilla.metricas,
      proyectosCompletados,
      proyectosActivos,
      proyectosPausados,
      avgAvanceProyectos: avgAvance,
      avgMargenProyectos: avgMargen,
      exitoPromedio,
    };

    get().updatePlantilla(plantillaId, { metricas: updatedMetricas });
  },

  actualizarMetricasTodasPlantillas: () => {
    const plantillas = get().plantillas;
    plantillas.forEach(p => {
      if (p.metricas && p.metricas.proyectoIds && p.metricas.proyectoIds.length > 0) {
        get().actualizarMetricasPlantilla(p.id);
      }
    });
  },

  validarIntegridadPlantilla: (plantillaId) => {
    const plantilla = get().plantillas.find(p => p.id === plantillaId);
    if (!plantilla) {
      return { valido: false, errores: ['Plantilla no encontrada'] };
    }

    const errores: string[] = [];

    if (!plantilla.nombre || plantilla.nombre.trim() === '') {
      errores.push('Nombre de plantilla es requerido');
    }

    if (!plantilla.categoria) {
      errores.push('Categoría de plantilla es requerida');
    }

    if (!plantilla.configuracion) {
      errores.push('Configuración de plantilla es requerida');
    } else {
      if (!plantilla.configuracion.tipologia) {
        errores.push('Tipología en configuración es requerida');
      }
      if (!plantilla.configuracion.tipoObra) {
        errores.push('Tipo de obra en configuración es requerido');
      }
      if (!plantilla.configuracion.moneda) {
        errores.push('Moneda en configuración es requerida');
      }
    }

    if (plantilla.estructuraPresupuesto && plantilla.estructuraPresupuesto.length > 0) {
      plantilla.estructuraPresupuesto.forEach((renglon, idx) => {
        if (!renglon.nombre || renglon.nombre.trim() === '') {
          errores.push(`Renglón ${idx + 1}: nombre es requerido`);
        }
        if (!renglon.unidad || renglon.unidad.trim() === '') {
          errores.push(`Renglón ${idx + 1}: unidad es requerida`);
        }
        if (renglon.cantidad < 0) {
          errores.push(`Renglón ${idx + 1}: cantidad no puede ser negativa`);
        }
      });
    }

    if (plantilla.hitosTemplate && plantilla.hitosTemplate.length > 0) {
      plantilla.hitosTemplate.forEach((hito, idx) => {
        if (!hito.nombre || hito.nombre.trim() === '') {
          errores.push(`Hito ${idx + 1}: nombre es requerido`);
        }
        if (hito.diasDesdeInicio < 0) {
          errores.push(`Hito ${idx + 1}: días desde inicio no puede ser negativo`);
        }
      });
    }

    if (plantilla.riesgosTemplate && plantilla.riesgosTemplate.length > 0) {
      plantilla.riesgosTemplate.forEach((riesgo, idx) => {
        if (!riesgo.categoria || riesgo.categoria.trim() === '') {
          errores.push(`Riesgo ${idx + 1}: categoría es requerida`);
        }
        if (!riesgo.descripcion || riesgo.descripcion.trim() === '') {
          errores.push(`Riesgo ${idx + 1}: descripción es requerida`);
        }
      });
    }

    if (plantilla.checklistCalidad && plantilla.checklistCalidad.length > 0) {
      plantilla.checklistCalidad.forEach((item, idx) => {
        if (!item.categoria || item.categoria.trim() === '') {
          errores.push(`Checklist item ${idx + 1}: categoría es requerida`);
        }
        if (!item.item || item.item.trim() === '') {
          errores.push(`Checklist item ${idx + 1}: item es requerido`);
        }
      });
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  },

  toggleFavoritoPlantilla: (plantillaId) => {
    const plantilla = get().plantillas.find(p => p.id === plantillaId);
    if (!plantilla) { return; }

    get().updatePlantilla(plantillaId, {
      favorita: !plantilla.favorita,
      updatedAt: new Date().toISOString(),
    });

    get().addAuditEntry({
      usuarioNombre: 'sistema',
      accion: plantilla.favorita ? 'quitar_favorito' : 'marcar_favorito',
      entidad: 'plantilla',
      entidadId: plantillaId,
      valoresNuevos: { favorita: !plantilla.favorita }
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

  addPlantilla: (p) => {
    const n = { ...p, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, usosCount: 0 } as Plantilla;
    get().setPlantillas(prev => [n, ...prev]);
    get().enqueueMutation('addPlantilla', n);
    get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'crear', entidad: 'plantilla', entidadId: n.id, valoresNuevos: { nombre: n.nombre, categoria: n.categoria } });
  },
  updatePlantilla: (id, patch) => {
    const existing = get().plantillas.find(p => p.id === id);
    if (!existing) return;
    const updated = { ...patch, updatedAt: new Date().toISOString() };
    get().setPlantillas(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    get().enqueueMutation('updatePlantilla', { id, ...updated });
    get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'actualizar', entidad: 'plantilla', entidadId: id, valoresAnteriores: { nombre: existing.nombre }, valoresNuevos: { ...patch } });
  },
  deletePlantilla: (id) => {
    const p = get().plantillas.find(x => x.id === id);
    get().setPlantillas(prev => prev.filter(p => p.id !== id));
    get().enqueueMutation('deletePlantilla', { id });
    if (p) get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'eliminar', entidad: 'plantilla', entidadId: id, valoresAnteriores: { nombre: p.nombre } });
  },
  clonarPlantilla: (plantillaId, nuevoNombre) => {
    const plantilla = get().plantillas.find(p => p.id === plantillaId);
    if (!plantilla) { return; }

    const clon: Plantilla = {
      ...plantilla,
      id: uid(),
      nombre: nuevoNombre || `${plantilla.nombre} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      usosCount: 0,
      metricas: {
        proyectoIds: [],
        proyectosCompletados: 0,
        proyectosActivos: 0,
        proyectosPausados: 0,
        avgAvanceProyectos: 0,
        avgMargenProyectos: 0,
        exitoPromedio: 50,
      },
      proyectoOrigenId: plantillaId,
    };

    get().setPlantillas(prev => [clon, ...prev]);
    get().enqueueMutation('addPlantilla', clon);
    get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'clonar', entidad: 'plantilla', entidadId: clon.id, valoresNuevos: { nombre: clon.nombre, plantillaOrigen: plantilla.nombre } });
  },
  exportarPlantilla: (plantillaId) => {
    const plantilla = get().plantillas.find(p => p.id === plantillaId);
    if (!plantilla) { return ''; }

    const exportData = {
      version: '1.0',
      exportadoEn: new Date().toISOString(),
      plantilla: plantilla,
    };

    return JSON.stringify(exportData, null, 2);
  },
  importarPlantilla: (plantillaJson) => {
    try {
      const importData = JSON.parse(plantillaJson);
      if (!importData.plantilla) {
        return;
      }

      const plantillaImportada = importData.plantilla;
      const nuevaPlantilla: Plantilla = {
        ...plantillaImportada,
        id: uid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        usosCount: 0,
        metricas: {
          proyectoIds: [],
          proyectosCompletados: 0,
          proyectosActivos: 0,
          proyectosPausados: 0,
          avgAvanceProyectos: 0,
          avgMargenProyectos: 0,
          exitoPromedio: 50,
        },
        proyectoOrigenId: plantillaImportada.id,
      };

      get().setPlantillas(prev => [nuevaPlantilla, ...prev]);
      get().enqueueMutation('addPlantilla', nuevaPlantilla);
      get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'importar', entidad: 'plantilla', entidadId: nuevaPlantilla.id, valoresNuevos: { nombre: nuevaPlantilla.nombre, origen: plantillaImportada.nombre } });
    } catch (error) {
      console.error('[importarPlantilla] Error al parsear JSON:', error);
    }
  },
  sugerirPlantillas: (caracteristicas) => {
    const plantillas = get().plantillas.filter(p => p.activa);
    if (!plantillas.length) return [];

    const scored = plantillas.map(plantilla => {
      let score = 0;

      if (caracteristicas.tipologia && plantilla.categoria === caracteristicas.tipologia) {
        score += 30;
      }

      if (caracteristicas.cliente && plantilla.clienteNombre === caracteristicas.cliente) {
        score += 25;
      }

      if (caracteristicas.tipoObra && plantilla.configuracion?.tipoObra === caracteristicas.tipoObra) {
        score += 15;
      }

      if (plantilla.metricas?.exitoPromedio) {
        score += plantilla.metricas.exitoPromedio * 0.2;
      }

      if (plantilla.usosCount > 0) {
        score += Math.min(plantilla.usosCount * 2, 20);
      }

      if (plantilla.metricas?.ultimaUso) {
        const daysSinceUse = (Date.now() - new Date(plantilla.metricas.ultimaUso).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUse < 30) score += 10;
        else if (daysSinceUse < 90) score += 5;
      }

      if (plantilla.estructuraPresupuesto?.length > 0) score += 5;
      if (plantilla.hitosTemplate?.length > 0) score += 5;
      if (plantilla.riesgosTemplate?.length > 0) score += 3;

      return { plantilla, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .filter(item => item.score > 10)
      .slice(0, 5)
      .map(item => item.plantilla);
  },
  crearNuevaVersionPlantilla: (plantillaId, cambios, usuario = 'sistema') => {
    const plantilla = get().plantillas.find(p => p.id === plantillaId);
    if (!plantilla) { return; }

    const nuevaVersion = plantilla.version + 1;
    const snapshot = {
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      categoria: plantilla.categoria,
      configuracion: plantilla.configuracion,
      estructuraPresupuesto: plantilla.estructuraPresupuesto,
      hitosTemplate: plantilla.hitosTemplate,
      riesgosTemplate: plantilla.riesgosTemplate,
      checklistCalidad: plantilla.checklistCalidad,
    };

    const nuevoHistorial = (plantilla.versionHistorial || []).concat({
      version: nuevaVersion,
      fecha: new Date().toISOString(),
      usuario,
      cambios,
      snapshot,
    });

    get().updatePlantilla(plantillaId, {
      version: nuevaVersion,
      versionHistorial: nuevoHistorial,
      updatedAt: new Date().toISOString(),
    });

    get().addAuditEntry({
      usuarioNombre: usuario,
      accion: 'crear_version',
      entidad: 'plantilla',
      entidadId: plantillaId,
      valoresNuevos: { version: nuevaVersion, cambios }
    });
  },
  restaurarVersionPlantilla: (plantillaId, version) => {
    const plantilla = get().plantillas.find(p => p.id === plantillaId);
    if (!plantilla) { return; }

    const versionInfo = plantilla.versionHistorial?.find(h => h.version === version);
    if (!versionInfo || !versionInfo.snapshot) {
      return;
    }

    const snapshot = versionInfo.snapshot as any;
    const nuevaVersion = plantilla.version + 1;
    const nuevoHistorial = (plantilla.versionHistorial || []).concat({
      version: nuevaVersion,
      fecha: new Date().toISOString(),
      usuario: 'sistema',
      cambios: `Restaurado desde versión ${version}`,
      snapshot: {
        nombre: plantilla.nombre,
        descripcion: plantilla.descripcion,
        categoria: plantilla.categoria,
        configuracion: plantilla.configuracion,
        estructuraPresupuesto: plantilla.estructuraPresupuesto,
        hitosTemplate: plantilla.hitosTemplate,
        riesgosTemplate: plantilla.riesgosTemplate,
        checklistCalidad: plantilla.checklistCalidad,
      },
    });

    get().updatePlantilla(plantillaId, {
      nombre: snapshot.nombre,
      descripcion: snapshot.descripcion,
      categoria: snapshot.categoria,
      configuracion: snapshot.configuracion,
      estructuraPresupuesto: snapshot.estructuraPresupuesto,
      hitosTemplate: snapshot.hitosTemplate,
      riesgosTemplate: snapshot.riesgosTemplate,
      checklistCalidad: snapshot.checklistCalidad,
      version: nuevaVersion,
      versionHistorial: nuevoHistorial,
      updatedAt: new Date().toISOString(),
    });

    get().addAuditEntry({
      usuarioNombre: 'sistema',
      accion: 'restaurar_version',
      entidad: 'plantilla',
      entidadId: plantillaId,
      valoresNuevos: { versionRestaurada: version, nuevaVersion }
    });
  },
  crearProyectoDesdePlantilla: (plantillaId, proyectoData) => {
    const plantilla = get().plantillas.find(p => p.id === plantillaId);
    if (!plantilla) { return; }

    const validacion = get().validarIntegridadPlantilla(plantillaId);
    if (!validacion.valido) {
      return;
    }

    const nuevoProyectoId = uid();
    const config = plantilla.configuracion || {};

    const proyectoBase: Proyecto = {
      id: nuevoProyectoId,
      nombre: proyectoData.nombre || `Proyecto basado en ${plantilla.nombre}`,
      ubicacion: proyectoData.ubicacion || '',
      tipologia: config.tipologia || proyectoData.tipologia || 'residencial',
      tipoObra: config.tipoObra || proyectoData.tipoObra || 'nueva',
      presupuestoTotal: 0,
      montoContrato: proyectoData.montoContrato || 0,
      cliente: proyectoData.cliente || '',
      presupuestoActualId: null,
      fechaInicio: proyectoData.fechaInicio || '',
      fechaFin: proyectoData.fechaFin || '',
      fechaInicioReal: proyectoData.fechaInicioReal,
      fechaFinEstimada: proyectoData.fechaFinEstimada,
      avanceFisico: 0,
      avanceFinanciero: 0,
      estado: 'planeacion',
      descripcion: proyectoData.descripcion || plantilla.descripcion || '',
      clienteNit: proyectoData.clienteNit,
      clienteTelefono: proyectoData.clienteTelefono,
      clienteEmail: proyectoData.clienteEmail,
      direccion: proyectoData.direccion,
      ciudad: proyectoData.ciudad,
      departamento: proyectoData.departamento,
      codigoPostal: proyectoData.codigoPostal,
      pais: proyectoData.pais || 'Guatemala',
      areaConstruccion: proyectoData.areaConstruccion,
      numPisos: proyectoData.numPisos,
      plazoSemanas: proyectoData.plazoSemanas,
      ingenieroResidente: proyectoData.ingenieroResidente,
      supervisor: proyectoData.supervisor,
      arquitecto: proyectoData.arquitecto,
      numeroExpediente: proyectoData.numeroExpediente,
      numeroLicencia: proyectoData.numeroLicencia,
      margenUtilidadObjetivo: proyectoData.margenUtilidadObjetivo,
      moneda: config.moneda || proyectoData.moneda || 'GTQ',
      etapa: proyectoData.etapa || 'planificacion',
      lat: proyectoData.lat,
      lng: proyectoData.lng,
      latitud: proyectoData.latitud,
      longitud: proyectoData.longitud,
      factorSobrecosto: config.factorSobrecosto || proyectoData.factorSobrecosto,
      version: 1,
    };

    get().addProyecto(proyectoBase);

    if (plantilla.estructuraPresupuesto && plantilla.estructuraPresupuesto.length > 0) {
      const presupuestoId = uid();
      const renglones = plantilla.estructuraPresupuesto.map(r => ({
        id: uid(),
        codigo: r.codigo,
        nombre: r.nombre,
        unidad: r.unidad,
        cantidad: r.cantidad,
        costoMateriales: r.costoMateriales,
        costoManoObra: r.costoManoObra,
        costoEquipo: r.costoEquipo,
        costoSubcontrato: r.costoSubcontrato,
        descripcion: r.descripcion,
      }));

      const totalCalculado = renglones.reduce((sum, r) => sum + ((r.costoMateriales + r.costoManoObra + r.costoEquipo + r.costoSubcontrato) * r.cantidad), 0);

      const nuevoPresupuesto: Presupuesto = {
        id: presupuestoId,
        proyectoId: nuevoProyectoId,
        nombre: `Presupuesto base - ${plantilla.nombre}`,
        estado: 'borrador',
        version: 1,
        totalCalculado,
        renglones,
        fechaCreacion: new Date().toISOString(),
        moneda: config.moneda || 'GTQ',
      };

      get().addPresupuesto(nuevoPresupuesto);
      get().updateProyecto(nuevoProyectoId, { presupuestoActualId: presupuestoId });
    }

    if (plantilla.hitosTemplate && plantilla.hitosTemplate.length > 0) {
      const fechaInicio = proyectoData.fechaInicio ? new Date(proyectoData.fechaInicio) : new Date();
      const nuevosHitos = plantilla.hitosTemplate.map(h => {
        const fechaHito = new Date(fechaInicio.getTime() + (h.diasDesdeInicio * 24 * 60 * 60 * 1000));
        return {
          id: uid(),
          proyectoId: nuevoProyectoId,
          nombre: h.nombre,
          descripcion: h.descripcion,
          fecha: fechaHito.toISOString().slice(0, 10),
          estado: h.estado,
        };
      });

      nuevosHitos.forEach(h => get().addHito(h));
    }

    if (plantilla.riesgosTemplate && plantilla.riesgosTemplate.length > 0) {
      const nuevosRiesgos = plantilla.riesgosTemplate.map(r => ({
        id: uid(),
        proyectoId: nuevoProyectoId,
        categoria: r.categoria,
        descripcion: r.descripcion,
        nivel: r.nivel,
        estado: 'abierto',
        mitigation: r.mitigation,
      }));

      nuevosRiesgos.forEach(r => get().addRiesgo(r));
    }

    const currentMetricas = plantilla.metricas || { proyectoIds: [], proyectosCompletados: 0, proyectosActivos: 0, proyectosPausados: 0, avgAvanceProyectos: 0, avgMargenProyectos: 0, exitoPromedio: 50 };
    const updatedMetricas = {
      proyectoIds: [...(currentMetricas.proyectoIds || []), nuevoProyectoId],
      proyectosCompletados: currentMetricas.proyectosCompletados,
      proyectosActivos: currentMetricas.proyectosActivos + 1,
      proyectosPausados: currentMetricas.proyectosPausados,
      avgAvanceProyectos: 0,
      avgMargenProyectos: currentMetricas.avgMargenProyectos,
      ultimaUso: new Date().toISOString(),
      exitoPromedio: currentMetricas.exitoPromedio,
    };

    get().updatePlantilla(plantillaId, { 
      usosCount: (plantilla.usosCount || 0) + 1,
      metricas: updatedMetricas
    });
    get().addAuditEntry({ usuarioNombre: 'sistema', accion: 'crear_proyecto_desde_plantilla', entidad: 'proyecto', entidadId: nuevoProyectoId, valoresNuevos: { plantillaId: plantillaId, nombre: proyectoBase.nombre } });
  },

  updateProyectoWeather: (proyectoId, weatherData, impactData) => {
    const existing = get().proyectoWeather.find(pw => pw.proyectoId === proyectoId);
    const impact = {
      score: impactData.score ?? 0,
      level: impactData.level ?? ('low' as const),
      factors: impactData.factors ?? [],
      recommendations: impactData.recommendations ?? [],
    };
    const existingHistory = existing?.history || [];
    const newHistory = impactData.history
      ? [...existingHistory, ...impactData.history].slice(-60)
      : existingHistory;
    const updated: ProyectoWeather = {
      ...(existing || {}),
      proyectoId,
      weatherData,
      impact,
      constructionMetrics: impactData.constructionMetrics,
      schedulingWindows: impactData.schedulingWindows,
      historicalImpact: impactData.historicalImpact || existing?.historicalImpact,
      history: newHistory,
      lastUpdated: impactData.lastUpdated || new Date().toISOString(),
      enabled: true,
    };

    if (existing) {
      get().setProyectoWeather(prev => prev.map(pw => pw.proyectoId === proyectoId ? updated : pw));
    } else {
      get().setProyectoWeather(prev => [...prev, updated]);
    }
  },

  getProyectoWeather: (proyectoId) => {
    return get().proyectoWeather.find(pw => pw.proyectoId === proyectoId);
  },

  getSupplierPerformance: (proveedorId) => {
    const { proveedores, ordenes } = get();
    const proveedor = proveedores.find(p => p.id === proveedorId);
    if (!proveedor) return null;
    
    return calculateSupplierPerformance(proveedor, ordenes);
  },

  getAllSupplierPerformance: (filtroProyectoId) => {
    const { proveedores, ordenes } = get();
    const ordenesFiltradas = filtroProyectoId 
      ? ordenes.filter(o => o.proyectoId === filtroProyectoId)
      : ordenes;
    
    return proveedores.map(prov => 
      calculateSupplierPerformance(prov, ordenesFiltradas)
    );
  },

  updateAvance: (id, patch) => {
    set((state) => ({ avances: state.avances.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
    get().enqueueMutation('updateAvance', { id, ...patch });
  },

  updatePublicacionMuro: (id, patch) => {
    set((state) => ({ publicacionesMuro: state.publicacionesMuro.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    get().enqueueMutation('updatePublicacionMuro', { id, ...patch });
  },

  deletePublicacionMuro: (id) => {
    set((state) => ({ publicacionesMuro: state.publicacionesMuro.filter((p) => p.id !== id) }));
  },

  updateNotificacion: (id, patch) => {
    set((state) => ({ notificaciones: state.notificaciones.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
    get().enqueueMutation('updateNotificacion', { id, ...patch });
  },

  updateRecepcion: (id, patch) => {
    set((state) => ({ recepciones: state.recepciones.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    get().enqueueMutation('updateRecepcion', { id, ...patch });
  },

  updateVentaPaquete: (id, patch) => {
    set((state) => ({ ventasPaquetes: state.ventasPaquetes.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
    get().enqueueMutation('updateVentaPaquete', { id, ...patch });
  },

  deleteVentaPaquete: (id) => {
    set((state) => ({ ventasPaquetes: state.ventasPaquetes.filter((v) => v.id !== id) }));
    get().enqueueMutation('deleteVentaPaquete', { id });
  },

  addError: (entry) => {
    const newEntry = { id: uid(), ...entry, createdAt: new Date().toISOString() };
    set((state) => ({ errorLogs: [...state.errorLogs, newEntry] }));
    get().enqueueMutation('addError', newEntry);
  },

  duplicarCotizacion: (id) => {
    const original = get().cotizacionesNegocio.find((c) => c.id === id);
    if (!original) return;
    const nueva = { ...original, id: uid(), numero: original.numero + " (copia)" };
    get().addCotizacion(nueva);
  },
  deleteReglaFactor: (id) => {
    set((state) => ({ reglasFactores: state.reglasFactores.filter((r) => r.id !== id) }));
    get().enqueueMutation('deleteReglaFactor', { id });
  },
  deleteNormativaDepartamental: (id) => {
    set((state) => ({ normativasDepartamentales: state.normativasDepartamentales.filter((n) => n.id !== id) }));
    get().enqueueMutation('deleteNormativaDepartamental', { id });
  },
  deleteEscalaProduccion: (id) => {
    set((state) => ({ escalasProduccion: state.escalasProduccion.filter((e) => e.id !== id) }));
    get().enqueueMutation('deleteEscalaProduccion', { id });
  },
  deleteEstacionalidad: (id) => {
    set((state) => ({ estacionalidad: state.estacionalidad.filter((e) => e.id !== id) }));
    get().enqueueMutation('deleteEstacionalidad', { id });
  },
  deleteAjusteEstacionalActividad: (id) => {
    get().enqueueMutation('deleteAjusteEstacionalActividad', { id });
  },
  setReglasFactores: (v) => {
    set((state) => ({ reglasFactores: typeof v === 'function' ? (v as (s: ReglaFactor[]) => ReglaFactor[])(state.reglasFactores) : v }));
    get().enqueueMutation('setReglasFactores', typeof v === 'function' ? (v as (s: ReglaFactor[]) => ReglaFactor[])(get().reglasFactores) : v as ReglaFactor[]);
  },
  setNormativasDepartamentales: (v) => {
    set((state) => ({ normativasDepartamentales: typeof v === 'function' ? (v as (s: NormativaDepartamental[]) => NormativaDepartamental[])(state.normativasDepartamentales) : v }));
    get().enqueueMutation('setNormativasDepartamentales', typeof v === 'function' ? (v as (s: NormativaDepartamental[]) => NormativaDepartamental[])(get().normativasDepartamentales) : v as NormativaDepartamental[]);
  },
  setEscalasProduccion: (v) => {
    set((state) => ({ escalasProduccion: typeof v === 'function' ? (v as (s: EscalaProduccion[]) => EscalaProduccion[])(state.escalasProduccion) : v }));
    get().enqueueMutation('setEscalasProduccion', typeof v === 'function' ? (v as (s: EscalaProduccion[]) => EscalaProduccion[])(get().escalasProduccion) : v as EscalaProduccion[]);
  },
  setEstacionalidad: (v) => {
    set((state) => ({ estacionalidad: typeof v === 'function' ? (v as (s: Estacionalidad[]) => Estacionalidad[])(state.estacionalidad) : v }));
    get().enqueueMutation('setEstacionalidad', typeof v === 'function' ? (v as (s: Estacionalidad[]) => Estacionalidad[])(get().estacionalidad) : v as Estacionalidad[]);
  },
}));



