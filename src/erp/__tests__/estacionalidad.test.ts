import { describe, it, expect, vi } from 'vitest';
import { Estacionalidad, safeParseEstacionalidadArray, parseEstacionalidad } from '../services/estacionalidad';

const mockSupabaseRpc = vi.fn();
const mockSupabaseFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: any[]) => mockSupabaseRpc(...args),
    from: (...args: any[]) => mockSupabaseFrom(...args),
  },
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('estacionalidad', () => {
  describe('safeParseEstacionalidadArray', () => {
    it('parses valid array data', () => {
      const data = [
        {
          id: '1',
          departamento_codigo: 'GT',
          mes: 1,
          temporada: 'seca',
          factor_disponibilidad: 1.0,
          factor_costo: 1.0,
          factor_productividad: 1.0,
          factor_especifico: 1.0,
          condiciones_climaticas: 'Normales',
          restricciones_especiales: [],
          riesgos_estacionales: [],
        },
      ];
      const result = safeParseEstacionalidadArray(data);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('returns empty array for invalid data', () => {
      expect(safeParseEstacionalidadArray(null)).toEqual([]);
      expect(safeParseEstacionalidadArray(undefined)).toEqual([]);
      expect(safeParseEstacionalidadArray('invalid')).toEqual([]);
    });
  });

  describe('parseEstacionalidad', () => {
    it('parses valid object', () => {
      const data = {
        id: '1',
        departamento_codigo: 'GT',
        mes: 1,
        temporada: 'seca',
        factor_disponibilidad: 1.0,
        factor_costo: 1.0,
        factor_productividad: 1.0,
        factor_especifico: 1.0,
        condiciones_climaticas: 'Normales',
        restricciones_especiales: [],
        riesgos_estacionales: [],
      };
      const result = parseEstacionalidad(data);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });

    it('returns null for invalid object', () => {
      expect(parseEstacionalidad(null)).toBeNull();
      expect(parseEstacionalidad({ id: '1' })).toBeNull();
    });
  });

  describe('Estacionalidad.aplicarFactoresEstacionales', () => {
    beforeEach(() => {
      mockSupabaseRpc.mockReset();
    });

    it('returns fallback values when Supabase RPC fails', async () => {
      mockSupabaseRpc.mockResolvedValue({ error: { message: 'offline' } });

      const est = new Estacionalidad();
      const result = await est.aplicarFactoresEstacionales(1000, 'GT', 1);

      expect(result.costo_ajustado).toBe(1000);
      expect(result.factor_total).toBe(1.0);
      expect(result.porcentaje_ajuste).toBe(0);
    });

    it('returns parsed RPC result on success', async () => {
      const mockData = [{
        costo_ajustado: 1200,
        factor_disponibilidad: 0.9,
        factor_costo: 1.2,
        factor_productividad: 1.0,
        factor_especifico: 1.1,
        factor_total: 1.2,
        diferencia_costo: 200,
        porcentaje_ajuste: 20,
        temporada: 'lluviosa',
        condiciones_climaticas: 'Lluvias intensas',
      }];

      mockSupabaseRpc.mockResolvedValue({ data: mockData, error: null });

      const est = new Estacionalidad();
      const result = await est.aplicarFactoresEstacionales(1000, 'GT', 6);

      expect(result.costo_ajustado).toBe(1200);
      expect(result.factor_total).toBe(1.2);
      expect(result.porcentaje_ajuste).toBe(20);
      expect(result.temporada).toBe('lluviosa');
    });
  });

  describe('Estacionalidad.obtenerFactoresEstacionales', () => {
    beforeEach(() => {
      mockSupabaseRpc.mockReset();
    });

    it('returns null on error', async () => {
      mockSupabaseRpc.mockResolvedValue({ error: { message: 'offline' } });

      const est = new Estacionalidad();
      const result = await est.obtenerFactoresEstacionales('GT', 1);

      expect(result).toBeNull();
    });

    it('returns first row on success', async () => {
      const mockData = [
        {
          id: '1',
          departamento_codigo: 'GT',
          mes: 1,
          temporada: 'seca',
          factor_disponibilidad: 1.0,
          factor_costo: 1.0,
          factor_productividad: 1.0,
          factor_especifico: 1.0,
          condiciones_climaticas: 'Normales',
          restricciones_especiales: [],
          riesgos_estacionales: [],
        },
      ];

      mockSupabaseRpc.mockResolvedValue({ data: mockData, error: null });

      const est = new Estacionalidad();
      const result = await est.obtenerFactoresEstacionales('GT', 1);

      expect(result?.id).toBe('1');
      expect(result?.temporada).toBe('seca');
    });
  });
});
