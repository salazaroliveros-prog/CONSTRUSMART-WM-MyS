import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicApiService } from '../services/publicApi';

const hoisted = vi.hoisted(() => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();

  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ order: mockOrder });

  return { mockRpc, mockFrom, mockSelect, mockUpdate, mockEq, mockOrder };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => hoisted.mockRpc(...args),
    from: (...args: any[]) => hoisted.mockFrom(...args),
  },
  hasSupabase: true,
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('publicApi', () => {
  beforeEach(() => {
    hoisted.mockRpc.mockReset();
    hoisted.mockFrom.mockReset();
    hoisted.mockSelect.mockReset();
    hoisted.mockUpdate.mockReset();
    hoisted.mockEq.mockReset();
    hoisted.mockOrder.mockReset();
    hoisted.mockFrom.mockReturnValue({ select: hoisted.mockSelect, update: hoisted.mockUpdate });
    hoisted.mockSelect.mockReturnValue({ eq: hoisted.mockEq });
    hoisted.mockUpdate.mockReturnValue({ eq: hoisted.mockEq });
    hoisted.mockEq.mockReturnValue({ order: hoisted.mockOrder });
  });

  describe('PublicApiService.generarApiKey', () => {
    it('returns key data on success', async () => {
      hoisted.mockRpc.mockResolvedValue({ data: 'plain-key', error: null });

      const result = await PublicApiService.generarApiKey('test-key');
      expect(result.key).toBe('plain-key');
    });

    it('throws on error', async () => {
      hoisted.mockRpc.mockResolvedValue({ error: { message: 'RPC failed' } });

      await expect(PublicApiService.generarApiKey('test-key')).rejects.toThrow();
    });
  });

  describe('PublicApiService.obtenerApiKeys', () => {
    it('returns mapped API keys on success', async () => {
      const mockData = [
        {
          id: 'key-1',
          name: 'Test Key',
          scopes: ['read'],
          empresa_id: 'emp-1',
          expires_at: '2026-12-31',
          created_at: '2026-01-01',
          last_used_at: '2026-01-02',
          activo: true,
        },
      ];

      hoisted.mockOrder.mockImplementation((_resolve: any, _reject: any) => ({ data: mockData, error: null }));

      const result = await PublicApiService.obtenerApiKeys();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('key-1');
      expect(result[0].empresaId).toBe('emp-1');
      expect(result[0].scopes).toEqual(['read']);
    });

    it('returns empty array on error', async () => {
      hoisted.mockOrder.mockImplementation((_resolve: any, reject: any) => reject({ message: 'offline' }));

      const result = await PublicApiService.obtenerApiKeys();
      expect(result).toEqual([]);
    });
  });

  describe('PublicApiService.revocarApiKey', () => {
    it('revokes key on success', async () => {
      hoisted.mockOrder.mockReturnValue({
        then: (resolve: any) => resolve({ error: null }),
      });

      await expect(PublicApiService.revocarApiKey('key-1')).resolves.toBeUndefined();
    });
  });

  describe('PublicApiService.obtenerProyectosPublicos', () => {
    it('returns data on success', async () => {
      const mockData = [
        {
          id: 'proy-1',
          nombre: 'Proyecto 1',
          cliente: 'Cliente A',
          tipologia: 'residencial',
          estado: 'activo',
          presupuesto_total: 100000,
          monto_contrato: 120000,
          avance_fisico: 50,
          avance_financiero: 45,
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-12-31',
        },
      ];

      hoisted.mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await PublicApiService.obtenerProyectosPublicos('hash', 'emp-1');
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Proyecto 1');
    });

    it('throws on error', async () => {
      hoisted.mockRpc.mockResolvedValue({ error: { message: 'RPC failed' } });

      await expect(PublicApiService.obtenerProyectosPublicos('hash')).rejects.toThrow();
    });
  });

  describe('PublicApiService.obtenerMovimientosProyecto', () => {
    it('returns data on success', async () => {
      const mockData = [
        {
          id: 'mov-1',
          proyecto_id: 'proy-1',
          tipo: 'ingreso',
          categoria: 'presupuesto',
          descripcion: 'Pago inicial',
          monto: 50000,
          fecha: '2026-01-15',
        },
      ];

      hoisted.mockRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await PublicApiService.obtenerMovimientosProyecto('hash', 'proy-1');
      expect(result).toHaveLength(1);
      expect(result[0].monto).toBe(50000);
    });
  });

  describe('PublicApiService.obtenerKPIsProyecto', () => {
    it('returns first KPI row on success', async () => {
      const mockData = [
        {
          presupuesto_total: 100000,
          costo_real: 80000,
          ingreso_real: 120000,
          utilidad_bruta: 40000,
          margen_bruto: 33.33,
          variacion_presupuesto: -20000,
          avance_fisico: 50,
          avance_financiero: 45,
        },
      ];

      const mockKpiData = [
        {
          presupuestoTotal: 100000,
          costoReal: 80000,
          ingresoReal: 120000,
          utilidadBruta: 40000,
          margenBruto: 33.33,
          variacionPresupuesto: -20000,
          avanceFisico: 50,
          avanceFinanciero: 45,
        },
      ];

      hoisted.mockRpc.mockResolvedValue({ data: mockKpiData, error: null });

      const result = await PublicApiService.obtenerKPIsProyecto('hash', 'proy-1');
      expect(result?.presupuestoTotal).toBe(100000);
      expect(result?.margenBruto).toBeCloseTo(33.33, 1);
    });

    it('returns null when data is empty', async () => {
      hoisted.mockRpc.mockResolvedValue({ data: [], error: null });

      const result = await PublicApiService.obtenerKPIsProyecto('hash', 'proy-1');
      expect(result).toBeNull();
    });
  });

  describe('PublicApiService.notificarProyectoCreado', () => {
    it('sends webhook notification', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      const proyecto = {
        id: 'proy-1',
        nombre: 'Proyecto 1',
        cliente: 'Cliente A',
        tipologia: 'residencial',
        estado: 'activo',
        presupuestoTotal: 100000,
        montoContrato: 120000,
        avanceFisico: 0,
        avanceFinanciero: 0,
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
      };

      await PublicApiService.notificarProyectoCreado('https://example.com/webhook', proyecto, 'api-key');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer api-key',
        },
        body: expect.any(String),
      });
    });

    it('throws on webhook failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      vi.stubGlobal('fetch', mockFetch);

      const proyecto = {
        id: 'proy-1',
        nombre: 'Proyecto 1',
        cliente: 'Cliente A',
        tipologia: 'residencial',
        estado: 'activo',
        presupuestoTotal: 100000,
        montoContrato: 120000,
        avanceFisico: 0,
        avanceFinanciero: 0,
        fechaInicio: '2026-01-01',
        fechaFin: '2026-12-31',
      };

      await expect(PublicApiService.notificarProyectoCreado('https://example.com/webhook', proyecto, 'api-key')).rejects.toThrow();
    });
  });

  describe('PublicApiService.notificarMovimientoCreado', () => {
    it('sends webhook notification', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      const movimiento = {
        id: 'mov-1',
        proyectoId: 'proy-1',
        tipo: 'ingreso',
        categoria: 'presupuesto',
        descripcion: 'Pago inicial',
        monto: 50000,
        fecha: '2026-01-15',
      };

      await PublicApiService.notificarMovimientoCreado('https://example.com/webhook', movimiento, 'api-key');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer api-key',
        },
        body: expect.any(String),
      });
    });
  });
});
