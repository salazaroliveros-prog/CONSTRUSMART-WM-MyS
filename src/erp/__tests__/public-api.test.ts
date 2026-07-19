import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockRpc, mockFrom, dbChain } = vi.hoisted(() => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn();
  const chain: Record<string, any> = {};
  chain.select = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(() => Promise.resolve({ data: [], error: null }));
  mockFrom.mockReturnValue(chain);
  return { mockRpc, mockFrom, dbChain: chain };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
  },
  hasSupabase: true,
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: { error: vi.fn() },
}));

import { PublicApiService } from '../services/publicApi';
import * as supabaseModule from '@/lib/supabase';

beforeEach(() => {
  vi.clearAllMocks();
  dbChain.order.mockResolvedValue({ data: [], error: null });
});

describe('PublicApiService', () => {
  describe('generarApiKey', () => {
    it('calls supabase.rpc with correct params', async () => {
      mockRpc.mockResolvedValue({ data: 'sk-abc123', error: null });
      const result = await PublicApiService.generarApiKey('My Key', 'emp-1', ['read', 'write'], 365);
      expect(mockRpc).toHaveBeenCalledWith('generar_api_key_hash', {
        p_name: 'My Key',
        p_empresa_id: 'emp-1',
        p_scopes: ['read', 'write'],
        p_expires_days: 365,
      });
      expect(result.key).toBe('sk-abc123');
    });

    it('returns key from RPC response', async () => {
      mockRpc.mockResolvedValue({ data: 'sk-generated-key', error: null });
      const result = await PublicApiService.generarApiKey('Test');
      expect(result.key).toBe('sk-generated-key');
      expect(result.keyHash).toBe('');
    });

    it('throws error when RPC fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('DB error') });
      await expect(PublicApiService.generarApiKey('Test')).rejects.toThrow('DB error');
    });

    it('throws error when hasSupabase is false', async () => {
      vi.mocked(supabaseModule).hasSupabase = false;
      await expect(PublicApiService.generarApiKey('Test')).rejects.toThrow('Supabase no está disponible');
      vi.mocked(supabaseModule).hasSupabase = true;
    });

    it('passes null for optional params when omitted', async () => {
      mockRpc.mockResolvedValue({ data: 'sk-key', error: null });
      await PublicApiService.generarApiKey('Minimal');
      expect(mockRpc).toHaveBeenCalledWith('generar_api_key_hash', {
        p_name: 'Minimal',
        p_empresa_id: null,
        p_scopes: ['read'],
        p_expires_days: null,
      });
    });
  });

  describe('obtenerApiKeys', () => {
    it('returns array of ApiKeyInfo from supabase response', async () => {
      const mockKeys = [
        { id: '1', name: 'Key1', scopes: ['read'], empresa_id: 'e1', expires_at: '2025-01-01', created_at: '2024-01-01', last_used_at: '2024-06-01' },
        { id: '2', name: 'Key2', scopes: ['read', 'write'], empresa_id: null, expires_at: null, created_at: '2024-02-01', last_used_at: null },
      ];
      dbChain.order.mockResolvedValue({ data: mockKeys, error: null });
      const result = await PublicApiService.obtenerApiKeys();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('Key1');
      expect(result[0].scopes).toEqual(['read']);
      expect(result[0].empresaId).toBe('e1');
      expect(result[0].createdAt).toBe('2024-01-01');
      expect(result[1].name).toBe('Key2');
    });

    it('returns empty array when hasSupabase is false', async () => {
      vi.mocked(supabaseModule).hasSupabase = false;
      const result = await PublicApiService.obtenerApiKeys();
      expect(result).toEqual([]);
      vi.mocked(supabaseModule).hasSupabase = true;
    });

    it('returns empty array when RPC throws', async () => {
      dbChain.order.mockRejectedValue(new Error('Network error'));
      const result = await PublicApiService.obtenerApiKeys();
      expect(result).toEqual([]);
    });

    it('queries from erp_api_keys table with correct filters', async () => {
      dbChain.order.mockResolvedValue({ data: [], error: null });
      await PublicApiService.obtenerApiKeys();
      expect(mockFrom).toHaveBeenCalledWith('erp_api_keys');
      expect(dbChain.select).toHaveBeenCalledWith('*');
      expect(dbChain.eq).toHaveBeenCalledWith('activo', true);
      expect(dbChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('revocarApiKey', () => {
    it('calls supabase.from update correctly', async () => {
      await PublicApiService.revocarApiKey('key-123');
      expect(mockFrom).toHaveBeenCalledWith('erp_api_keys');
      expect(dbChain.update).toHaveBeenCalledWith({ activo: false });
      expect(dbChain.eq).toHaveBeenCalledWith('id', 'key-123');
    });

    it('throws when update fails', async () => {
      dbChain.eq.mockReturnValueOnce(Promise.resolve({ error: new Error('Update failed') }));
      await expect(PublicApiService.revocarApiKey('key-123')).rejects.toThrow('Update failed');
    });

    it('returns early when hasSupabase is false', async () => {
      vi.mocked(supabaseModule).hasSupabase = false;
      await PublicApiService.revocarApiKey('key-123');
      expect(mockFrom).not.toHaveBeenCalled();
      vi.mocked(supabaseModule).hasSupabase = true;
    });
  });

  describe('obtenerProyectosPublicos', () => {
    it('calls RPC with correct params', async () => {
      mockRpc.mockResolvedValue({ data: [{ id: 'p1', nombre: 'Proy' }], error: null });
      const result = await PublicApiService.obtenerProyectosPublicos('hash-1', 'emp-1', 'ejecucion', 10, 0);
      expect(mockRpc).toHaveBeenCalledWith('api_obtener_proyectos', {
        p_api_key_hash: 'hash-1',
        p_empresa_id: 'emp-1',
        p_estado: 'ejecucion',
        p_limit: 10,
        p_offset: 0,
      });
      expect(result).toHaveLength(1);
    });

    it('returns empty array when hasSupabase is false', async () => {
      vi.mocked(supabaseModule).hasSupabase = false;
      const result = await PublicApiService.obtenerProyectosPublicos('hash');
      expect(result).toEqual([]);
      vi.mocked(supabaseModule).hasSupabase = true;
    });

    it('throws on RPC error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('Unauthorized') });
      await expect(PublicApiService.obtenerProyectosPublicos('hash')).rejects.toThrow('Unauthorized');
    });
  });

  describe('obtenerMovimientosProyecto', () => {
    it('calls RPC with correct params', async () => {
      mockRpc.mockResolvedValue({ data: [{ id: 'm1' }], error: null });
      const result = await PublicApiService.obtenerMovimientosProyecto('hash', 'proy-1', 'gasto', 'materiales', 50);
      expect(mockRpc).toHaveBeenCalledWith('api_obtener_movimientos_proyecto', {
        p_api_key_hash: 'hash',
        p_proyecto_id: 'proy-1',
        p_tipo: 'gasto',
        p_categoria: 'materiales',
        p_limit: 50,
      });
      expect(result).toHaveLength(1);
    });

    it('returns empty array when hasSupabase is false', async () => {
      vi.mocked(supabaseModule).hasSupabase = false;
      const result = await PublicApiService.obtenerMovimientosProyecto('hash', 'pid');
      expect(result).toEqual([]);
      vi.mocked(supabaseModule).hasSupabase = true;
    });
  });

  describe('obtenerKPIsProyecto', () => {
    it('returns first KPI from array response', async () => {
      const kpiData = [{
        presupuestoTotal: 500000, costoReal: 300000, ingresoReal: 450000,
        utilidadBruta: 150000, margenBruto: 33.33, variacionPresupuesto: -40,
        avanceFisico: 60, avanceFinanciero: 50,
      }];
      mockRpc.mockResolvedValue({ data: kpiData, error: null });
      const result = await PublicApiService.obtenerKPIsProyecto('hash', 'proy-1');
      expect(result).toEqual(kpiData[0]);
    });

    it('returns null when no data', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });
      const result = await PublicApiService.obtenerKPIsProyecto('hash', 'proy-1');
      expect(result).toBeNull();
    });

    it('returns null when hasSupabase is false', async () => {
      vi.mocked(supabaseModule).hasSupabase = false;
      const result = await PublicApiService.obtenerKPIsProyecto('hash', 'proy-1');
      expect(result).toBeNull();
      vi.mocked(supabaseModule).hasSupabase = true;
    });
  });

  describe('notificarProyectoCreado', () => {
    it('sends POST with correct headers and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      const proyecto = {
        id: 'p1', nombre: 'Test', cliente: 'C1', tipologia: 'residencial',
        estado: 'ejecucion', presupuestoTotal: 100000, montoContrato: 120000,
        avanceFisico: 0, avanceFinanciero: 0, fechaInicio: '2025-01-01', fechaFin: '2025-12-31',
      };

      await PublicApiService.notificarProyectoCreado('https://hook.example.com', proyecto, 'sk-key');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hook.example.com',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-key',
          },
          body: expect.stringContaining('"event":"proyecto_creado"'),
        })
      );
      vi.unstubAllGlobals();
    });

    it('throws when response not ok', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
      vi.stubGlobal('fetch', mockFetch);

      const proyecto = {
        id: 'p1', nombre: 'Test', cliente: 'C1', tipologia: 'residencial',
        estado: 'ejecucion', presupuestoTotal: 0, montoContrato: 0,
        avanceFisico: 0, avanceFinanciero: 0, fechaInicio: '', fechaFin: '',
      };

      await expect(
        PublicApiService.notificarProyectoCreado('https://hook.example.com', proyecto, 'sk-key')
      ).rejects.toThrow('Webhook failed: 401');
      vi.unstubAllGlobals();
    });

    it('throws on network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network failure'));
      vi.stubGlobal('fetch', mockFetch);

      const proyecto = {
        id: 'p1', nombre: 'Test', cliente: 'C1', tipologia: 'residencial',
        estado: 'ejecucion', presupuestoTotal: 0, montoContrato: 0,
        avanceFisico: 0, avanceFinanciero: 0, fechaInicio: '', fechaFin: '',
      };

      await expect(
        PublicApiService.notificarProyectoCreado('https://hook.example.com', proyecto, 'sk-key')
      ).rejects.toThrow('Network failure');
      vi.unstubAllGlobals();
    });
  });

  describe('notificarMovimientoCreado', () => {
    it('sends POST with correct headers and body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      const movimiento = {
        id: 'm1', proyectoId: 'p1', tipo: 'gasto', categoria: 'materiales',
        descripcion: 'Compra', monto: 5000, fecha: '2025-06-01',
      };

      await PublicApiService.notificarMovimientoCreado('https://hook.example.com', movimiento, 'sk-key');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hook.example.com',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-key',
          },
          body: expect.stringContaining('"event":"movimiento_creado"'),
        })
      );
      vi.unstubAllGlobals();
    });
  });
});
