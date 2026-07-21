import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidacionCalculos, validacionCalculos, mostrarValidaciones } from '../services/validacionCalculos';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          neq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(),
            })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/erp/zustandStore', () => ({
  useErpStore: {
    getState: vi.fn(() => ({
      enqueueMutation: vi.fn(),
    })),
  },
}));

describe('validacionCalculos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mostrarValidaciones', () => {
    it('returns true for empty alerts', () => {
      expect(mostrarValidaciones([])).toBe(true);
    });

    it('returns false when there are critical alerts', () => {
      const alertas = [
        { tipo: 'critica', mensaje: 'Error' },
      ];
      expect(mostrarValidaciones(alertas)).toBe(false);
    });

    it('logs warnings for high alerts but returns true', () => {
      const alertas = [
        { tipo: 'alta', mensaje: 'Warning' },
      ];
      expect(mostrarValidaciones(alertas)).toBe(true);
    });
  });

  describe('ValidacionCalculos instance', () => {
    it('is exported as singleton', () => {
      expect(validacionCalculos).toBeInstanceOf(ValidacionCalculos);
    });

    it('returns failed validation on error', async () => {
      const result = await validacionCalculos.validarConsistenciaCalculo('calc-1');
      expect(result.valido).toBe(false);
      expect(result.alertas).toEqual([]);
      expect(result.score_consistencia).toBe(0);
    });
  });
});
