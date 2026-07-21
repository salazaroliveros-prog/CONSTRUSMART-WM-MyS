import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  safeParseNormativaDepartamentalArray,
  parseNormativaDepartamental,
  NormativaDepartamental,
  normativaDepartamental,
} from '../services/normativaDepartamental';

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

vi.mock('@/lib/error-logger', () => ({
  logErrorFromException: vi.fn(),
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

describe('normativaDepartamental', () => {
  beforeEach(() => {
    mockSupabaseRpc.mockReset();
    mockSupabaseFrom.mockReset();
  });

  describe('safeParseNormativaDepartamentalArray', () => {
    it('parses valid array data', () => {
      const data = [
        {
          id: '1',
          departamento_codigo: 'GT',
          tipo_norma: 'construccion',
          codigo_norma: 'NOM-001',
          nombre_norma: 'Norma General',
          activo: true,
        },
      ];
      const result = safeParseNormativaDepartamentalArray(data);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('returns empty array for invalid data', () => {
      expect(safeParseNormativaDepartamentalArray(null)).toEqual([]);
      expect(safeParseNormativaDepartamentalArray(undefined)).toEqual([]);
    });
  });

  describe('parseNormativaDepartamental', () => {
    it('parses valid object', () => {
      const data = {
        id: '1',
        departamento_codigo: 'GT',
        tipo_norma: 'construccion',
        codigo_norma: 'NOM-001',
        nombre_norma: 'Norma General',
        activo: true,
      };
      const result = parseNormativaDepartamental(data);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });

    it('returns null for invalid object', () => {
      expect(parseNormativaDepartamental(null)).toBeNull();
      expect(parseNormativaDepartamental({ id: '1' })).toBeNull();
    });
  });

  describe('NormativaDepartamental.obtenerNormativasDepartamento', () => {
    beforeEach(() => {
      mockSupabaseRpc.mockReset();
    });

    it('returns empty array on error', async () => {
      mockSupabaseRpc.mockResolvedValue({ error: { message: 'offline' } });

      const result = await normativaDepartamental.obtenerNormativasDepartamento('GT');
      expect(result).toEqual([]);
    });

    it('returns parsed data on success', async () => {
      const mockData = [
        {
          id: '1',
          departamento_codigo: 'GT',
          tipo_norma: 'construccion',
          codigo_norma: 'NOM-001',
          nombre_norma: 'Norma General',
          activo: true,
        },
      ];

      mockSupabaseRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await normativaDepartamental.obtenerNormativasDepartamento('GT');
      expect(result).toHaveLength(1);
      expect(result[0].codigo_norma).toBe('NOM-001');
    });
  });

  describe('NormativaDepartamental.validarCumplimientoNormativo', () => {
    beforeEach(() => {
      mockSupabaseRpc.mockReset();
    });

    it('returns empty array on error', async () => {
      mockSupabaseRpc.mockResolvedValue({ error: { message: 'offline' } });

      const result = await normativaDepartamental.validarCumplimientoNormativo('proy-1', 'GT', 'construccion', {});
      expect(result).toEqual([]);
    });

    it('returns validation results on success', async () => {
      const mockData = [
        {
          norma_id: '1',
          codigo_norma: 'NOM-001',
          estado_cumplimiento: 'cumple',
          alertas: [],
        },
      ];

      mockSupabaseRpc.mockResolvedValue({ data: mockData, error: null });

      const result = await normativaDepartamental.validarCumplimientoNormativo('proy-1', 'GT', 'construccion', {});
      expect(result).toHaveLength(1);
      expect(result[0].estado_cumplimiento).toBe('cumple');
    });
  });

  describe('NormativaDepartamental.obtenerTodasNormativas', () => {
    beforeEach(() => {
      mockSupabaseFrom.mockReset();
    });

    it('returns empty array on error', async () => {
      mockSupabaseFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            order: () => ({
              then: (_resolve: any, reject: any) => reject({ message: 'offline' }),
            }),
          }),
        }),
      });

      const result = await normativaDepartamental.obtenerTodasNormativas();
      expect(result).toEqual([]);
    });
  });
});
