import { useEffect, useRef, useCallback } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { log } from '@/lib/auto-logger';

type TableName =
  | 'erp_proyectos' | 'erp_movimientos' | 'erp_empleados' | 'erp_materiales'
  | 'erp_ordenes_compra' | 'erp_proveedores' | 'erp_eventos_calendario'
  | 'erp_bitacora' | 'erp_presupuestos' | 'erp_licitaciones'
  | 'erp_avances' | 'erp_vales_salida' | 'erp_notificaciones'
  | 'erp_ordenes_cambio' | 'erp_seguimiento' | 'erp_cuentas_cobrar'
  | 'erp_cuentas_pagar' | 'erp_hitos' | 'erp_riesgos'
  | 'erp_publicaciones_muro' | 'erp_pruebas_laboratorio'
  | 'erp_no_conformidades' | 'erp_liberaciones_partida'
  | 'erp_planos' | 'erp_rfis' | 'erp_submittals'
  | 'erp_activos_herramienta' | 'erp_cuadros_comparativos'
  | 'erp_pagos_proveedor' | 'erp_incidentes_sso'
  | 'erp_cotizaciones_negocio';

type ChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

interface RealtimeConfig {
  tablas: TableName[];
  onCambio: (payload: { tabla: string; tipo: ChangeType; datos: unknown; id: string }) => void;
  filtro?: { columna: string; valor: string };
  enabled?: boolean;
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
export function useSupabaseRealtime(config: RealtimeConfig) {
  const {
    tablas,
    onCambio,
    filtro,
    enabled = true,
  } = config;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCambioRef = useRef(onCambio);
  onCambioRef.current = onCambio;

  const subscribe = useCallback(() => {
    if (!hasSupabase || !enabled) return;

    // Limpiar canal anterior si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `erp-realtime-${tablas.join('-')}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Suscribirse a cada tabla
    tablas.forEach(tabla => {
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
          scheduleReconnect();
          break;

        case 'TIMED_OUT':
          log('warn', 'Realtime', 'Timeout en canal Realtime', { canal: channelName });
          scheduleReconnect();
          break;

        case 'CLOSED':
          log('info', 'Realtime', 'Canal Realtime cerrado', { canal: channelName });
          break;
      }
    });

    channelRef.current = channel;
  }, [tablas, filtro, enabled]);

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