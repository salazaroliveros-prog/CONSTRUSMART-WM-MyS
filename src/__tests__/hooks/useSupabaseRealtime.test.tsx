import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSupabaseRealtime, filterByRolSistema } from '@/hooks/useSupabaseRealtime';
import type { RolSistema } from '@/lib/security';

const hoisted = vi.hoisted(() => {
  let subscribeCb: ((status: string) => void) | null = null;
  const pgChangesCbs: Array<(payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void> = [];
  const mockChannelOn = vi.fn((_event: string, _config: unknown, callback: (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => void) => {
    pgChangesCbs.push(callback);
    return mockChannel;
  });
  const mockChannelSubscribe = vi.fn((callback: (status: string) => void) => {
    subscribeCb = callback;
  });
  const mockChannel = {
    on: mockChannelOn,
    subscribe: mockChannelSubscribe,
  };
  const mockChannelFn = vi.fn(() => mockChannel);
  const mockRemoveChannel = vi.fn();

  return {
    mockChannel,
    mockChannelOn,
    mockChannelSubscribe,
    mockChannelFn,
    mockRemoveChannel,
    getSubscribeCb: () => subscribeCb,
    setSubscribeCb: (v: null) => { subscribeCb = v; },
    getPgChangesCbs: () => pgChangesCbs,
    clearPgChangesCbs: () => { pgChangesCbs.length = 0; },
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: hoisted.mockChannelFn,
    removeChannel: hoisted.mockRemoveChannel,
  },
  hasSupabase: true,
}));

vi.mock('@/lib/auto-logger', () => ({
  log: vi.fn(),
}));

function createPayload(eventType: string, overrides: Record<string, unknown> = {}) {
  return {
    eventType,
    new: { id: 'rec-1', name: 'test', ...overrides },
    old: { id: 'rec-1', ...overrides },
  };
}

const defaultOnCambio = vi.fn();
const defaultTablas = ['erp_proyectos' as const, 'erp_movimientos' as const];

describe('useSupabaseRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.setSubscribeCb(null);
    hoisted.clearPgChangesCbs();
    defaultOnCambio.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribes to specified tables', () => {
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(1);
    const channelName = hoisted.mockChannelFn.mock.calls[0][0] as string;
    expect(channelName).toContain('erp-realtime-');
    expect(channelName).toContain('erp_proyectos');
    expect(channelName).toContain('erp_movimientos');
    expect(hoisted.mockChannelOn).toHaveBeenCalledTimes(2);
    expect(hoisted.mockChannelOn.mock.calls[0][1]).toMatchObject({ table: 'erp_proyectos', schema: 'public' });
    expect(hoisted.mockChannelOn.mock.calls[1][1]).toMatchObject({ table: 'erp_movimientos', schema: 'public' });
    expect(hoisted.mockChannelSubscribe).toHaveBeenCalledTimes(1);
  });

  it('onCambio handler fires on INSERT', async () => {
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    const cbs = hoisted.getPgChangesCbs();
    expect(cbs.length).toBe(2);
    await act(async () => {
      cbs[0](createPayload('INSERT', { name: 'new-project' }));
    });
    expect(defaultOnCambio).toHaveBeenCalledTimes(1);
    expect(defaultOnCambio).toHaveBeenCalledWith({
      tabla: 'erp_proyectos',
      tipo: 'INSERT',
      datos: expect.objectContaining({ id: 'rec-1', name: 'new-project' }),
      id: 'rec-1',
    });
  });

  it('onCambio handler fires on UPDATE', async () => {
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    const cbs = hoisted.getPgChangesCbs();
    await act(async () => {
      cbs[0](createPayload('UPDATE', { name: 'updated' }));
    });
    expect(defaultOnCambio).toHaveBeenCalledTimes(1);
    expect(defaultOnCambio).toHaveBeenCalledWith({
      tabla: 'erp_proyectos',
      tipo: 'UPDATE',
      datos: expect.objectContaining({ id: 'rec-1', name: 'updated' }),
      id: 'rec-1',
    });
  });

  it('onCambio handler fires on DELETE', async () => {
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    const cbs = hoisted.getPgChangesCbs();
    await act(async () => {
      cbs[0](createPayload('DELETE', {}));
    });
    expect(defaultOnCambio).toHaveBeenCalledTimes(1);
    expect(defaultOnCambio).toHaveBeenCalledWith({
      tabla: 'erp_proyectos',
      tipo: 'DELETE',
      datos: expect.objectContaining({ id: 'rec-1' }),
      id: 'rec-1',
    });
  });

  it('not enabled', () => {
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
      enabled: false,
    }));
    expect(hoisted.mockChannelFn).not.toHaveBeenCalled();
    expect(hoisted.mockChannelSubscribe).not.toHaveBeenCalled();
  });

  it('no tables', () => {
    renderHook(() => useSupabaseRealtime({
      tablas: [],
      onCambio: defaultOnCambio,
    }));
    expect(hoisted.mockChannelFn).not.toHaveBeenCalled();
    expect(hoisted.mockChannelSubscribe).not.toHaveBeenCalled();
  });

  it('channel cleanup on unmount', () => {
    const { unmount } = renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    expect(hoisted.mockRemoveChannel).not.toHaveBeenCalled();
    unmount();
    expect(hoisted.mockRemoveChannel).toHaveBeenCalledTimes(1);
    expect(hoisted.mockRemoveChannel.mock.calls[0][0]).toBe(hoisted.mockChannel);
  });

  it('SUBSCRIBED status resets reconnect attempt', async () => {
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    const cb = hoisted.getSubscribeCb();
    expect(cb).not.toBeNull();
    await act(async () => {
      cb!('SUBSCRIBED');
    });
    expect(hoisted.mockChannelSubscribe).toHaveBeenCalled();
  });

  it('CHANNEL_ERROR triggers scheduleReconnect', async () => {
    vi.useFakeTimers();
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    const cb = hoisted.getSubscribeCb();
    expect(cb).not.toBeNull();
    await act(async () => {
      cb!('CHANNEL_ERROR');
    });
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('TIMED_OUT status triggers scheduleReconnect', async () => {
    vi.useFakeTimers();
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    const cb = hoisted.getSubscribeCb();
    await act(async () => {
      cb!('TIMED_OUT');
    });
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('CLOSED status does not trigger reconnect', async () => {
    vi.useFakeTimers();
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    const cb = hoisted.getSubscribeCb();
    await act(async () => {
      cb!('CLOSED');
    });
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('exponential backoff reconnect', async () => {
    vi.useFakeTimers();
    renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    const getCb = () => hoisted.getSubscribeCb();

    await act(async () => { getCb()!('CHANNEL_ERROR'); });
    vi.advanceTimersByTime(1000);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(2);

    await act(async () => { getCb()!('CHANNEL_ERROR'); });
    vi.advanceTimersByTime(2000);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(3);

    await act(async () => { getCb()!('CHANNEL_ERROR'); });
    vi.advanceTimersByTime(4000);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(4);

    await act(async () => { getCb()!('CHANNEL_ERROR'); });
    vi.advanceTimersByTime(8000);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(5);

    await act(async () => { getCb()!('CHANNEL_ERROR'); });
    vi.advanceTimersByTime(16000);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(6);

    await act(async () => { getCb()!('CHANNEL_ERROR'); });
    vi.advanceTimersByTime(16000);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(7);

    vi.useRealTimers();
  });

  it('filter by columna/valor', () => {
    renderHook(() => useSupabaseRealtime({
      tablas: ['erp_movimientos'],
      onCambio: defaultOnCambio,
      filtro: { columna: 'proyecto_id', valor: 'proj-42' },
    }));
    expect(hoisted.mockChannelOn).toHaveBeenCalledTimes(1);
    const configFiltro = hoisted.mockChannelOn.mock.calls[0][1] as Record<string, unknown>;
    expect(configFiltro.filter).toBe('proyecto_id=eq.proj-42');
  });

  it('resubscribe function', async () => {
    const { result } = renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(1);
    await act(async () => {
      result.current.resubscribe();
    });
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(2);
  });

  it('resubscribe with nuevasTablas removes old channel', async () => {
    const { result } = renderHook(() => useSupabaseRealtime({
      tablas: defaultTablas,
      onCambio: defaultOnCambio,
    }));
    expect(hoisted.mockRemoveChannel).not.toHaveBeenCalled();
    await act(async () => {
      result.current.resubscribe(['erp_activos']);
    });
    expect(hoisted.mockRemoveChannel).toHaveBeenCalledWith(hoisted.mockChannel);
    expect(hoisted.mockChannelFn).toHaveBeenCalledTimes(1);
  });
});

describe('filterByRolSistema', () => {
  const allTables = [
    'erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales',
    'erp_notificaciones', 'erp_publicaciones_muro',
    'erp_presupuestos', 'erp_ordenes_compra', 'erp_avances', 'erp_vales_salida',
    'erp_cotizaciones_negocio', 'erp_licitaciones', 'erp_destajos', 'erp_recepciones',
    'erp_hitos', 'erp_riesgos', 'erp_ordenes_cambio',
    'erp_cuentas_cobrar', 'erp_cuentas_pagar', 'erp_no_conformidades',
    'erp_incidentes', 'erp_pruebas_laboratorio', 'erp_liberaciones_partida',
    'erp_planos', 'erp_rfis', 'erp_submittals', 'erp_activos', 'erp_cuadros',
    'erp_ventas_paquetes', 'erp_pagos_proveedor',
  ] as const;

  it('Admin sees all tables', () => {
    const result = filterByRolSistema([...allTables], 'Administrador');
    expect(result).toEqual([...allTables]);
  });

  it('Bodeguero only sees relevant tables', () => {
    const result = filterByRolSistema([...allTables], 'Bodeguero');
    expect(result).toEqual(['erp_materiales', 'erp_vales_salida', 'erp_recepciones']);
  });

  it('no rol returns all tables', () => {
    const result = filterByRolSistema([...allTables], undefined);
    expect(result).toEqual([...allTables]);
  });

  it('unknown rol returns all tables', () => {
    const result = filterByRolSistema([...allTables], 'UnknownRole' as RolSistema);
    expect(result).toEqual([...allTables]);
  });

  it('Residente sees restricted set', () => {
    const result = filterByRolSistema([...allTables], 'Residente');
    expect(result).toContain('erp_proyectos');
    expect(result).toContain('erp_movimientos');
    expect(result).toContain('erp_materiales');
    expect(result).toContain('erp_avances');
    expect(result).toContain('erp_vales_salida');
    expect(result).toContain('erp_notificaciones');
    expect(result).toContain('erp_hitos');
    expect(result).toContain('erp_ordenes_cambio');
    expect(result).toContain('erp_no_conformidades');
    expect(result).toContain('erp_incidentes');
    expect(result).toContain('erp_pruebas_laboratorio');
    expect(result).toContain('erp_liberaciones_partida');
    expect(result).not.toContain('erp_empleados');
    expect(result).not.toContain('erp_ordenes_compra');
    expect(result).not.toContain('erp_cotizaciones_negocio');
    expect(result).not.toContain('erp_destajos');
    expect(result).not.toContain('erp_recepciones');
  });
});
