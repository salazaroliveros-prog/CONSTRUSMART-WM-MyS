import { z } from 'zod';
import { safeLogger } from '@/lib/safeLogger';
import { hasSupabase, assertSupabase, supabase } from '@/lib/supabase';
import { sanitizarObjeto } from '@/lib/security';
import { toSnake, toCamel } from '../utils';
import { logErrorFromException } from '@/lib/error-logger';
import type { Mutation, AppSettings } from '../types';

export type ConnectionStatus = 'online' | 'offline' | 'checking';

const ONLINE_EVENT = 'online';
const OFFLINE_EVENT = 'offline';

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | 0 >> (c === 'x' ? 0 : 1)).toString(16));
}

export interface HybridPersistenceOptions {
  storagePrefix: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onSyncError?: (error: string) => void;
}

export class HybridPersistenceManager {
  private status: ConnectionStatus = 'checking';
  private syncInProgress = false;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;

  constructor(private options: HybridPersistenceOptions) {}

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  startListening(): void {
    this.updateStatus(this.isOnline() ? 'online' : 'offline');
    this.onlineHandler = () => {
      this.updateStatus('online');
    };
    this.offlineHandler = () => {
      this.updateStatus('offline');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(ONLINE_EVENT, this.onlineHandler);
      window.addEventListener(OFFLINE_EVENT, this.offlineHandler);
    }
  }

  stopListening(): void {
    if (typeof window !== 'undefined') {
      if (this.onlineHandler) window.removeEventListener(ONLINE_EVENT, this.onlineHandler);
      if (this.offlineHandler) window.removeEventListener(OFFLINE_EVENT, this.offlineHandler);
    }
    this.onlineHandler = null;
    this.offlineHandler = null;
  }

  private updateStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.options.onStatusChange?.(status);
    }
  }

  loadFromStorage<T>(key: string, schema: z.ZodTypeAny): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const result = z.array(schema).safeParse(JSON.parse(raw));
      return result.success ? result.data : [];
    } catch {
      safeLogger.warn(`[Persistence] Corrupto: ${key}`);
      return [];
    }
  }

  loadObjectFromStorage<T>(key: string, schema: z.ZodTypeAny, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const result = schema.safeParse(JSON.parse(raw));
      return result.success ? result.data : fallback;
    } catch {
      safeLogger.warn(`[Persistence] Corrupto: ${key}`);
      return fallback;
    }
  }

  saveToStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      safeLogger.warn(`[Persistence] Error guardando ${key}:`, error);
    }
  }

  saveObjectToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      safeLogger.warn(`[Persistence] Error guardando ${key}:`, error);
    }
  }

  removeFromStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  clearAll(prefix: string): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  enqueueMutation(type: string, payload: Record<string, unknown>): Mutation {
    const mutation: Mutation = {
      id: uid(),
      type,
      payload: toSnake(sanitizarObjeto(payload)),
      timestamp: Date.now(),
      retryCount: 0,
    };
    return mutation;
  }

  async syncMutation(mutation: Mutation): Promise<boolean> {
    if (!this.isOnline() || !hasSupabase) return false;
    try {
      const client = assertSupabase();
      const table = this.getTableForMutation(mutation.type);
      if (!table) return true;

      const payload = toSnake(sanitizarObjeto(mutation.payload));
      if (mutation.type.startsWith('add') || mutation.type.startsWith('update') || mutation.type.startsWith('set')) {
        const { error } = await client.from(table).upsert(payload, { onConflict: 'id', ignoreDuplicates: false });
        if (error) throw error;
      } else if (mutation.type.startsWith('delete')) {
        const { error } = await client.from(table).delete().in('id', [payload.id]);
        if (error) throw error;
      }
      return true;
    } catch (error) {
      safeLogger.warn(`[Persistence] Error sincronizando ${mutation.type}:`, error);
      return false;
    }
  }

  async syncBatch(mutations: Mutation[]): Promise<{ processed: string[]; failed: Mutation[] }> {
    const processed: string[] = [];
    const failed: Mutation[] = [];
    for (const mutation of mutations) {
      const success = await this.syncMutation(mutation);
      if (success) {
        processed.push(mutation.id);
      } else {
        failed.push(mutation);
      }
    }
    return { processed, failed };
  }

  private getTableForMutation(type: string): string | null {
    const TABLE_MAP: Record<string, string> = {
      addProyecto: 'erp_proyectos', updateProyecto: 'erp_proyectos', deleteProyecto: 'erp_proyectos',
      addMovimiento: 'erp_movimientos', updateMovimiento: 'erp_movimientos', deleteMovimiento: 'erp_movimientos',
      addEmpleado: 'erp_empleados', updateEmpleado: 'erp_empleados', deleteEmpleado: 'erp_empleados',
      addMaterial: 'erp_materiales', updateMaterial: 'erp_materiales', deleteMaterial: 'erp_materiales',
      addOrden: 'erp_ordenes_compra', updateOrden: 'erp_ordenes_compra', deleteOrden: 'erp_ordenes_compra',
      addProveedor: 'erp_proveedores', updateProveedor: 'erp_proveedores', deleteProveedor: 'erp_proveedores',
      addEvento: 'erp_eventos_calendario', updateEvento: 'erp_eventos_calendario', deleteEvento: 'erp_eventos_calendario',
      addBitacora: 'erp_bitacora', updateBitacora: 'erp_bitacora', deleteBitacora: 'erp_bitacora',
      addPresupuesto: 'erp_presupuestos', updatePresupuesto: 'erp_presupuestos', deletePresupuesto: 'erp_presupuestos',
      addLicitacion: 'erp_licitaciones', updateLicitacion: 'erp_licitaciones', deleteLicitacion: 'erp_licitaciones',
      addCotizacion: 'erp_cotizaciones_negocio', updateCotizacion: 'erp_cotizaciones_negocio', deleteCotizacion: 'erp_cotizaciones_negocio',
      addVentaPaquete: 'erp_ventas_paquetes', updateVentaPaquete: 'erp_ventas_paquetes', deleteVentaPaquete: 'erp_ventas_paquetes',
      addAvance: 'erp_avances', updateAvance: 'erp_avances', deleteAvance: 'erp_avances',
      addCuentaCobrar: 'erp_cuentas_cobrar', updateCuentaCobrar: 'erp_cuentas_cobrar', deleteCuentaCobrar: 'erp_cuentas_cobrar',
      addCuentaPagar: 'erp_cuentas_pagar', updateCuentaPagar: 'erp_cuentas_pagar', deleteCuentaPagar: 'erp_cuentas_pagar',
      addOrdenCambio: 'erp_ordenes_cambio', updateOrdenCambio: 'erp_ordenes_cambio', deleteOrdenCambio: 'erp_ordenes_cambio',
      addHito: 'erp_hitos', updateHito: 'erp_hitos', deleteHito: 'erp_hitos',
      addRiesgo: 'erp_riesgos', updateRiesgo: 'erp_riesgos', deleteRiesgo: 'erp_riesgos',
      addPlano: 'erp_planos', updatePlano: 'erp_planos', deletePlano: 'erp_planos',
      addRfi: 'erp_rfis', updateRfi: 'erp_rfis', deleteRfi: 'erp_rfis',
      addSubmittal: 'erp_submittals', updateSubmittal: 'erp_submittals', deleteSubmittal: 'erp_submittals',
      addActivo: 'erp_activos', updateActivo: 'erp_activos', deleteActivo: 'erp_activos',
      addCuadro: 'erp_cuadros', updateCuadro: 'erp_cuadros', deleteCuadro: 'erp_cuadros',
      addPagoProveedor: 'erp_pagos_proveedor', updatePagoProveedor: 'erp_pagos_proveedor', deletePagoProveedor: 'erp_pagos_proveedor',
      addIncidente: 'erp_incidentes', updateIncidente: 'erp_incidentes', deleteIncidente: 'erp_incidentes',
      addDestajo: 'erp_destajos', updateDestajo: 'erp_destajos', deleteDestajo: 'erp_destajos',
      addInsumoBase: 'erp_insumos_base', updateInsumoBase: 'erp_insumos_base', deleteInsumoBase: 'erp_insumos_base',
      addCalculoProyecto: 'erp_calculos_proyecto', updateCalculoProyecto: 'erp_calculos_proyecto', deleteCalculoProyecto: 'erp_calculos_proyecto',
      addRecepcion: 'erp_recepciones', updateRecepcion: 'erp_recepciones', deleteRecepcion: 'erp_recepciones',
      addValeSalida: 'erp_vales_salida', updateValeSalida: 'erp_vales_salida', deleteValeSalida: 'erp_vales_salida',
      addPublicacionMuro: 'erp_publicaciones_muro', updatePublicacionMuro: 'erp_publicaciones_muro', deletePublicacionMuro: 'erp_publicaciones_muro',
      addComentarioMuro: 'erp_publicaciones_muro', likePublicacionMuro: 'erp_publicaciones_muro',
      addPrueba: 'erp_pruebas_laboratorio', updatePrueba: 'erp_pruebas_laboratorio', deletePrueba: 'erp_pruebas_laboratorio',
      addNC: 'erp_no_conformidades', updateNC: 'erp_no_conformidades', deleteNC: 'erp_no_conformidades',
      addLiberacion: 'erp_liberaciones_partida', updateLiberacion: 'erp_liberaciones_partida', deleteLiberacion: 'erp_liberaciones_partida',
      addNotificacion: 'erp_notificaciones', updateNotificacion: 'erp_notificaciones', markNotificacionLeida: 'erp_notificaciones', deleteNotificacion: 'erp_notificaciones',
      addSeguimiento: 'erp_seguimiento', updateSeguimiento: 'erp_seguimiento', deleteSeguimiento: 'erp_seguimiento',
      addPlantilla: 'erp_plantillas_proyectos', updatePlantilla: 'erp_plantillas_proyectos', deletePlantilla: 'erp_plantillas_proyectos',
      addErrorLog: 'erp_error_log', addError: 'erp_error_log', resolveError: 'erp_error_log', deleteError: 'erp_error_log', cleanupOldErrors: 'erp_error_log',
      addCentroCosto: 'erp_centros_costo', updateCentroCosto: 'erp_centros_costo', deleteCentroCosto: 'erp_centros_costo',
      addReglaFactor: 'erp_reglas_factores', updateReglaFactor: 'erp_reglas_factores', deleteReglaFactor: 'erp_reglas_factores',
      addNormativaDepartamental: 'erp_normativa_departamental', updateNormativaDepartamental: 'erp_normativa_departamental', deleteNormativaDepartamental: 'erp_normativa_departamental',
      addEscalaProduccion: 'erp_escalas_produccion', updateEscalaProduccion: 'erp_escalas_produccion', deleteEscalaProduccion: 'erp_escalas_produccion',
      addEstacionalidad: 'erp_estacionalidad', updateEstacionalidad: 'erp_estacionalidad', deleteEstacionalidad: 'erp_estacionalidad',
      addAjusteEstacionalActividad: 'erp_ajustes_estacionales_actividad', updateAjusteEstacionalActividad: 'erp_ajustes_estacionales_actividad', deleteAjusteEstacionalActividad: 'erp_ajustes_estacionales_actividad',
      addHistorialAplicacionRegla: 'erp_historial_aplicacion_reglas', registrarAplicacionRegla: 'erp_historial_aplicacion_reglas',
      addProyectoWeather: 'erp_proyecto_weather', updateProyectoWeather: 'erp_proyecto_weather', deleteProyectoWeather: 'erp_proyecto_weather',
      setReglasFactores: 'erp_reglas_factores', setNormativasDepartamentales: 'erp_normativa_departamental',
      setEscalasProduccion: 'erp_escalas_produccion', setEstacionalidad: 'erp_estacionalidad',
    };
    return TABLE_MAP[type] || null;
  }

  async validateWithSupabase(table: string, id: string): Promise<boolean> {
    if (!this.isOnline() || !hasSupabase) return true;
    try {
      const client = assertSupabase();
      const { data, error } = await client.from(table).select('id').eq('id', id).maybeSingle();
      return !error && !!data;
    } catch {
      return true;
    }
  }
}
