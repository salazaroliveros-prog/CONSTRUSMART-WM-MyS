import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  safeParseEscalaProduccionArray,
  parseEscalaProduccion,
  EscalasProduccion,
  escalasProduccion,
} from '../services/escalasProduccion';

const mockSupabaseRpc = vi.fn();
const mockSupabaseFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => mockSupabaseRpc(...args),
    from: (...args: any[]) => mockSupabaseFrom(...args),
  },
  hasSupabase: true,
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/erp/zustandStore', () => ({
  useErpStore: {
    getState: vi.fn(() => ({
      enqueueMutation: vi.fn(),
    })),
  },
}));

vi.mock('@/erp/utils', () => ({
  safeParseArray: (value: any) => value || [],
}));

describe('escalasProduccion', () => {
  beforeEach(() => {
    mockSupabaseRpc.mockReset();
    mockSupabaseFrom.mockReset();
  });

  describe('safeParseEscalaProduccionArray', () => {
    it('parses valid array data', () => {
      const data = [
        {
          id: '1',
          tipo_proyecto: 'residencial',
          subtipo_proyecto: 'casa',
          rango_tamano: 'mediano',
          activo: true,
          tamano_minimo: 1,
          tamano_maximo: 10,
          factor_economia: 0.9,
          factor_administracion: 1.1,
          factor_imprevistos: 1.05,
          factor_logistica: 1.0,
          factor_financiero: 1.0,
          costo_por_renolon: 100,
        },
      ];
      const result = safeParseEscalaProduccionArray(data);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('returns empty array for invalid data', () => {
      expect(safeParseEscalaProduccionArray(null)).toEqual([]);
      expect(safeParseEscalaProduccionArray(undefined)).toEqual([]);
    });
  });

  describe('parseEscalaProduccion', () => {
    it('parses valid object', () => {
      const data = {
        id: '1',
        tipo_proyecto: 'residencial',
        subtipo_proyecto: 'casa',
        rango_tamano: 'mediano',
        activo: true,
        tamano_minimo: 1,
        tamano_maximo: 10,
        factor_economia: 0.9,
        factor_administracion: 1.1,
        factor_imprevistos: 1.05,
        factor_logistica: 1.0,
        factor_financiero: 1.0,
        costo_por_renolon: 100,
      };
      const result = parseEscalaProduccion(data);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });

    it('returns null for invalid object', () => {
      expect(parseEscalaProduccion(null)).toBeNull();
      expect(parseEscalaProduccion({ id: '1' })).toBeNull();
    });
  });

  describe('EscalasProduccion.aplicarFactoresEscala', () => {
    beforeEach(() => {
      mockSupabaseRpc.mockReset();
    });

    it('returns fallback values when Supabase RPC fails', async () => {
      mockSupabaseRpc.mockResolvedValue({ error: { message: 'offline' } });

      const result = await escalasProduccion.aplicarFactoresEscala(1000, 'residencial', 5);
      expect(result.costo_ajustado).toBe(1000);
      expect(result.factor_total).toBe(1.0);
      expect(result.rango_tamano).toBe('mediano');
    });

    it('returns parsed RPC result on success', async () => {
      const mockData = [{
        costo_ajustado: 900,
        factor_economia: 0.9,
        factor_administracion: 1.1,
        factor_imprevistos: 1.05,
        factor_logistica: 1.0,
        factor_financiero: 1.0,
        factor_total: 1.0,
        ahorro_estimado: 100,
        rango_tamano: 'pequeno',
      }];

      mockSupabaseRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await escalasProduccion.aplicarFactoresEscala(1000, 'residencial', 5);
      expect(result.costo_ajustado).toBe(900);
      expect(result.ahorro_estimado).toBe(100);
      expect(result.rango_tamano).toBe('pequeno');
    });
  });

  describe('EscalasProduccion.calcularAhorroEscala', () => {
    beforeEach(() => {
      mockSupabaseRpc.mockReset();
    });

    it('returns zero ahorro on error', async () => {
      mockSupabaseRpc.mockResolvedValue({ error: { message: 'offline' } });

      const result = await escalasProduccion.calcularAhorroEscala(1000, 'residencial', 5);
      expect(result.ahorro).toBe(0);
      expect(result.porcentajeAhorro).toBe(0);
      expect(result.costoAjustado).toBe(1000);
    });

    it('calculates ahorro on success', async () => {
      const mockData = [{
        costo_ajustado: 900,
        factor_economia: 0.9,
        factor_administracion: 1.1,
        factor_imprevistos: 1.05,
        factor_logistica: 1.0,
        factor_financiero: 1.0,
        factor_total: 1.0,
        ahorro_estimado: 100,
        rango_tamano: 'pequeno',
      }];

      mockSupabaseRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await escalasProduccion.calcularAhorroEscala(1000, 'residencial', 5);
      expect(result.ahorro).toBe(100);
      expect(result.porcentajeAhorro).toBeCloseTo(10, 5);
    });
  });

  describe('EscalasProduccion.determinarEscalaProyecto', () => {
    beforeEach(() => {
      mockSupabaseRpc.mockReset();
    });

    it('returns null on error', async () => {
      mockSupabaseRpc.mockResolvedValue({ error: { message: 'offline' } });

      const result = await escalasProduccion.determinarEscalaProyecto('residencial', 5);
      expect(result).toBeNull();
    });

    it('returns first row on success', async () => {
      const mockData = [{
        id: 'esc-1',
        tipo_proyecto: 'residencial',
        rango_tamano: 'mediano',
        factor_total: 1.0,
      }];

      mockSupabaseRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await escalasProduccion.determinarEscalaProyecto('residencial', 5);
      expect(result?.id).toBe('esc-1');
      expect(result?.rango_tamano).toBe('mediano');
    });
  });
});
