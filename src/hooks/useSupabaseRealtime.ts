import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, hasSupabase } from '@/lib/supabase';

// Extension of the store actions interface for type safety
interface StoreActions {
  addProyecto: (p: any) => Promise<void>;
  updateProyecto: (id: string, patch: any) => Promise<void>;
  deleteProyecto: (id: string) => Promise<void>;
  addMovimiento: (m: any) => Promise<void>;
  updateMovimiento: (id: string, patch: any) => Promise<void>;
  deleteMovimiento: (id: string) => Promise<void>;
  addPresupuesto: (p: any) => Promise<void>;
  updatePresupuesto: (id: string, patch: any) => Promise<void>;
  deletePresupuesto: (id: string) => Promise<void>;
  addSeguimiento?: (s: any) => Promise<void>;
  updateSeguimiento?: (id: string, patch: any) => Promise<void>;
  deleteSeguimiento?: (id: string) => Promise<void>;
  addInsumo?: (i: any) => Promise<void>;
  updateInsumo?: (id: string, patch: any) => Promise<void>;
  deleteInsumo?: (id: string) => Promise<void>;
  setOnline: (v: boolean) => void;
}

const TABLES = [
  { table: 'erp_proyectos', action: 'proyecto' as const },
  { table: 'erp_movimientos', action: 'movimiento' as const },
  { table: 'erp_presupuestos', action: 'presupuesto' as const },
  { table: 'erp_materiales', action: 'material' as const },
  { table: 'erp_empleados', action: 'empleado' as const },
  { table: 'erp_ordenes_compra', action: 'orden' as const },
  { table: 'erp_avances', action: 'avance' as const },
  { table: 'erp_proveedores', action: 'proveedor' as const },
  { table: 'erp_seguimiento', action: 'seguimiento' as const },
  { table: 'erp_insumos', action: 'insumo' as const },
  { table: 'erp_renglones', action: 'renglon' as const },
  { table: 'erp_sub_renglones', action: 'subrenglon' as const },
  { table: 'erp_cuentas_cobrar', action: 'cuenta_cobrar' as const },
  { table: 'erp_cuentas_pagar', action: 'cuenta_pagar' as const },
  { table: 'erp_ordenes_cambio', action: 'orden_cambio' as const },
  { table: 'erp_hitos', action: 'hito' as const },
  { table: 'erp_riesgos', action: 'riesgo' as const },
];

/**
 * Hook that subscribes to Supabase Realtime changes and syncs them to the local store.
 * Automatically handles reconnection and cleanup.
 */
export function useSupabaseRealtime(actions: StoreActions) {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectedRef = useRef(false);

  const handleRealtimeEvent = useCallback(async (
    actionType: 'proyecto' | 'movimiento' | 'presupuesto' | 'material' | 'empleado' | 'orden' | 'avance' | 'proveedor' | 'seguimiento' | 'insumo' | 'renglon' | 'subrenglon',
    event: string,
    payload: any
  ) => {
    const newRecord = payload.new;
    const oldRecord = payload.old;

    try {
      switch (event) {
        case 'INSERT':
          switch (actionType) {
            case 'proyecto': await actions.addProyecto(newRecord); break;
            case 'movimiento': await actions.addMovimiento(newRecord); break;
            case 'presupuesto': await actions.addPresupuesto(newRecord); break;
            case 'seguimiento': await actions.addSeguimiento?.(newRecord); break;
            case 'insumo': await actions.addInsumo?.(newRecord); break;
            default: break;
          }
          break;
        case 'UPDATE':
          switch (actionType) {
            case 'proyecto': await actions.updateProyecto(newRecord.id, newRecord); break;
            case 'movimiento': await actions.updateMovimiento(newRecord.id, newRecord); break;
            case 'presupuesto': await actions.updatePresupuesto(newRecord.id, newRecord); break;
            case 'seguimiento': await actions.updateSeguimiento?.(newRecord.id, newRecord); break;
            case 'insumo': await actions.updateInsumo?.(newRecord.id, newRecord); break;
            default: break;
          }
          break;
        case 'DELETE':
          switch (actionType) {
            case 'proyecto': await actions.deleteProyecto(oldRecord.id); break;
            case 'movimiento': await actions.deleteMovimiento(oldRecord.id); break;
            case 'presupuesto': await actions.deletePresupuesto(oldRecord.id); break;
            case 'seguimiento': await actions.deleteSeguimiento?.(oldRecord.id); break;
            case 'insumo': await actions.deleteInsumo?.(oldRecord.id); break;
            default: break;
          }
          break;
      }
    } catch (err) {
      console.warn(`[Realtime] Error processing ${event} ${actionType}:`, err);
    }
  }, [actions]);

  useEffect(() => {
    if (!hasSupabase) return;

    const setupChannels = () => {
      // Cleanup existing channels
      channelsRef.current.forEach(ch => {
        try { ch.unsubscribe(); } catch { /* ignore */ }
      });
      channelsRef.current = [];

      TABLES.forEach(({ table, action }) => {
        const channel = supabase.channel(`public:${table}`, {
          config: { broadcast: { self: true } },
        });

        channel
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            (payload) => {
              handleRealtimeEvent(action, payload.eventType, payload);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              isConnectedRef.current = true;
              actions.setOnline(true);
            } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
              isConnectedRef.current = false;
              // Schedule reconnection
              if (!reconnectTimerRef.current) {
                reconnectTimerRef.current = setTimeout(() => {
                  reconnectTimerRef.current = null;
                  setupChannels();
                }, 5000);
              }
            }
          });

        channelsRef.current.push(channel);
      });
    };

    setupChannels();

    // Cleanup on unmount
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      channelsRef.current.forEach(ch => {
        try { ch.unsubscribe(); } catch { /* ignore */ }
      });
      channelsRef.current = [];
    };
  }, [actions, handleRealtimeEvent]);

  return { isConnected: isConnectedRef.current };
}