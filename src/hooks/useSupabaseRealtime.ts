import { useEffect, useRef, useCallback } from 'react';
import { supabase, hasSupabase, hasServiceRole, getServiceRealtimeClient } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { log } from '@/lib/auto-logger';
import type { Rol } from '@/erp/store';

type TableName =
  | 'erp_proyectos' | 'erp_movimientos' | 'erp_empleados' | 'erp_materiales'
  | 'erp_ordenes_compra' | 'erp_proveedores' | 'erp_eventos_calendario'
  | 'erp_bitacora' | 'erp_presupuestos' | 'erp_licitaciones'
  | 'erp_avances' | 'erp_vales_salida' | 'erp_notificaciones'
  | 'erp_ordenes_cambio' | 'erp_seguimiento' | 'erp_cuentas_cobrar'
  | 'erp_cuentas_pagar' | 'erp_hitos' | 'erp_riesgos'
  | 'erp_publicaciones_muro' | 'erp_pruebas_laboratorio'
  | 'erp_no_conformidades' | 'erp_incidentes' | 'erp_liberaciones_partida'
  | 'erp_planos' | 'erp_rfis' | 'erp_submittals'
  | 'erp_activos' | 'erp_cuadros' | 'ventas_paquetes' | 'pagos_proveedores'
  | 'erp_cotizaciones_negocio'
  | 'destajos' | 'recepciones_almacen';

type ChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

const TABLAS_POR_ROL: Record<Rol, TableName[]> = {
  Administrador: [
    'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
    'erp_notificaciones', 'erp_publicaciones_muro',
    'erp_presupuestos', 'erp_ordenes_compra', 'erp_avances', 'erp_vales_salida',
    'erp_cotizaciones_negocio', 'erp_licitaciones', 'destajos', 'recepciones_almacen',
    'erp_hitos', 'erp_riesgos', 'erp_ordenes_cambio',
    'erp_cuentas_cobrar', 'erp_cuentas_pagar', 'erp_no_conformidades',
    'erp_incidentes', 'erp_pruebas_laboratorio', 'erp_liberaciones_partida',
    'erp_planos', 'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros',
    'ventas_paquetes', 'pagos_proveedores',
  ],
  Gerente: [
    'erp_proyectos', 'erp_movimientos', 'erp_empleados',
    'erp_notificaciones', 'erp_publicaciones_muro',
    'erp_presupuestos', 'erp_ordenes_compra', 'erp_avances',
    'erp_cotizaciones_negocio', 'erp_licitaciones',
    'erp_hitos', 'erp_riesgos', 'erp_ordenes_cambio',
    'erp_cuentas_cobrar', 'erp_cuentas_pagar', 'erp_no_conformidades',
    'erp_incidentes', 'erp_pruebas_laboratorio', 'erp_liberaciones_partida',
    'erp_planos', 'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros',
    'ventas_paquetes', 'pagos_proveedores',
  ],
  Residente: [
    'erp_proyectos', 'erp_movimientos', 'erp_materiales',
    'erp_avances', 'erp_vales_salida', 'erp_notificaciones',
    'erp_hitos', 'erp_ordenes_cambio', 'erp_no_conformidades',
    'erp_incidentes', 'erp_pruebas_laboratorio', 'erp_liberaciones_partida',
  ],
  Compras: [
    'erp_proyectos', 'erp_materiales', 'erp_ordenes_compra',
    'erp_notificaciones', 'erp_vales_salida', 'destajos', 'recepciones_almacen',
  ],
  Bodeguero: [
    'erp_materiales', 'erp_vales_salida', 'recepciones_almacen',
  ],
};

interface RealtimeConfig {
  tablas: TableName[];
  onCambio: (payload: { tabla: string; tipo: ChangeType; datos: unknown; id: string }) => void;
  filtro?: { columna: string; valor: string };
  enabled?: boolean;
  rol?: Rol;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

/**
 * Hook de Supabase Realtime con autoreconexión
 * 
 * Características:
 * - Suscripción a múltiples tablas en un solo canal
 * - Reconexión automática con backoff exponencial (1s → 16s)
 * - Filtro opcional por columna/valor (ej: solo cambios en un proyecto)
 * - Limpieza automática al desmontar
 * - Logging de eventos de conexión
 * - Manejo de errores en suscripción
 */
export function filterByRol(tables: TableName[], rol?: Rol): TableName[] {
  if (!rol) return tables;
  const allowed = TABLAS_POR_ROL[rol];
  if (!allowed) return tables;
  return tables.filter(t => allowed.includes(t));
}

export function useSupabaseRealtime(config: RealtimeConfig) {
  const {
    tablas,
    onCambio,
    filtro,
    enabled = true,
    rol,
  } = config;

  const effectiveTablas = filterByRol(tablas, rol);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCambioRef = useRef(onCambio);
  onCambioRef.current = onCambio;
  const scheduleReconnectRef = useRef<() => void>(() => {});

  const subscribe = useCallback(() => {
    if (!hasSupabase || !enabled || effectiveTablas.length === 0) return;

    // Determinar qué cliente usar: sesión real o service role (guest mode)
    let rtClient = supabase;
    if (hasServiceRole) {
      try {
        const raw = localStorage.getItem('sb-neygzluxugodiwcuctbj-auth-token');
        if (!raw || raw.includes('mock')) {
          rtClient = getServiceRealtimeClient();
        }
      } catch { /* ignore */ }
    }

    // Limpiar canal anterior si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `erp-realtime-${effectiveTablas.join('-')}-${Date.now()}`;
    const channel = rtClient.channel(channelName);

    // Suscribirse a cada tabla
    effectiveTablas.forEach(tabla => {
      const configFiltro: Record<string, unknown> = {
        schema: 'public',
        table: tabla,
      };
      if (filtro) {
        configFiltro.filter = `${filtro.columna}=eq.${filtro.valor}`;
      }

      channel.on(
        'postgres_changes' as never,
        configFiltro as never,
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          const tipo = payload.eventType.toUpperCase() as ChangeType;
          const datos = payload.new || payload.old;
          const id = (datos?.id as string) || '';

          log('info', 'Realtime', `Cambio en ${tabla}: ${tipo}`, { id });

          onCambioRef.current({
            tabla,
            tipo,
            datos,
            id,
          });
        }
      );
    });

    // Manejar estado de la suscripción
    channel.subscribe((status: string) => {
      switch (status) {
        case 'SUBSCRIBED':
          log('info', 'Realtime', `Conectado a ${tablas.length} tablas`, {
            tablas,
            canal: channelName,
          });
          reconnectAttemptRef.current = 0;
          break;

        case 'CHANNEL_ERROR':
          log('error', 'Realtime', 'Error en canal Realtime', { canal: channelName });
          scheduleReconnectRef.current();
          break;

        case 'TIMED_OUT':
          log('warn', 'Realtime', 'Timeout en canal Realtime', { canal: channelName });
          scheduleReconnectRef.current();
          break;

        case 'CLOSED':
          log('info', 'Realtime', 'Canal Realtime cerrado', { canal: channelName });
          break;
      }
    });

    channelRef.current = channel;
    }, [effectiveTablas, tablas, filtro, enabled]);

  const scheduleReconnect = useCallback(() => {
    const attempt = reconnectAttemptRef.current;
    const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];

    log('recovery', 'Realtime', `Reconectando en ${delay}ms (intento ${attempt + 1})`);

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    reconnectTimerRef.current = setTimeout(() => {
      reconnectAttemptRef.current++;
      subscribe();
    }, delay);
  }, [subscribe]);

  scheduleReconnectRef.current = scheduleReconnect;


  // Efecto principal: suscribir/desuscribir
  useEffect(() => {
    if (!enabled) return;
    subscribe();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        log('info', 'Realtime', 'Canal Realtime eliminado al desmontar');
      }
    };
  }, [enabled, subscribe]);

  // Función para cambiar suscripciones manualmente
  const resubscribe = useCallback((nuevasTablas?: TableName[]) => {
    if (nuevasTablas) {
      // Forzar recreación del canal con nuevas tablas
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      // El efecto se encargará de volver a suscribir
    } else {
      subscribe();
    }
  }, [subscribe]);

  return { resubscribe, isConnected: !!channelRef.current };
}
