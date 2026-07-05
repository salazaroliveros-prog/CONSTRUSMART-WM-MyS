import { describe, it, expect } from 'vitest';
import {
  costoDirectoUnitario,
  precioUnitarioVenta,
  factorSalarioReal,
  fmtQ,
  IVA,
  COSTOS_INDIRECTOS,
  HERRAMIENTA_MENOR,
  ADMINISTRACION,
  IMPREVISTOS,
} from '../erp/utils';

describe('Calculation Engine — Edge Cases', () => {
  describe('costoDirectoUnitario', () => {
    it('returns 0 when all inputs are 0', () => {
      expect(costoDirectoUnitario(0, 0, 0)).toBe(0);
    });

    it('handles undefined gracefully', () => {
      expect(costoDirectoUnitario(undefined, undefined, undefined)).toBe(0);
    });

    it('handles null inputs', () => {
      expect(costoDirectoUnitario(null as any, null as any, null as any)).toBe(0);
    });

    it('treats NaN as 0', () => {
      expect(costoDirectoUnitario(NaN, NaN, NaN)).toBe(0);
    });

    it('treats Infinity as 0 via || 0', () => {
      expect(costoDirectoUnitario(Infinity, Infinity, Infinity)).toBe(0);
    });

    it('handles negative values (physically possible in refunds)', () => {
      expect(costoDirectoUnitario(-100, -50, -25)).toBeCloseTo(-100 - 50 * (1 + HERRAMIENTA_MENOR) - 25, 10);
    });

    it('handles very large numbers without overflow', () => {
      const big = 1e15;
      const result = costoDirectoUnitario(big, big, big);
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    });

    it('includes minor tools multiplier on MO', () => {
      const mat = 0;
      const mo = 100;
      const eq = 0;
      const result = costoDirectoUnitario(mat, mo, eq);
      expect(result).toBeCloseTo(mo * (1 + HERRAMIENTA_MENOR), 10);
    });

    it('sums all three cost components', () => {
      expect(costoDirectoUnitario(100, 200, 50)).toBeCloseTo(100 + 200 * (1 + HERRAMIENTA_MENOR) + 50, 10);
    });
  });

  describe('precioUnitarioVenta', () => {
    it('returns 0 for zero input', () => {
      expect(precioUnitarioVenta(0)).toBe(0);
    });

    it('returns 0 for undefined input', () => {
      expect(precioUnitarioVenta(undefined as any)).toBe(0);
    });

    it('returns 0 for NaN input', () => {
      expect(precioUnitarioVenta(NaN)).toBe(0);
    });

    it('applies costos indirectos', () => {
      const cd = 100;
      const result = precioUnitarioVenta(cd);
      const expected = (cd + cd * COSTOS_INDIRECTOS) * (1 + ADMINISTRACION + IMPREVISTOS + IVA);
      expect(result).toBeCloseTo(expected, 5);
    });

    it('rounds result to 2 decimal places', () => {
      const result = precioUnitarioVenta(33.333);
      expect(Number(result.toFixed(2))).toBe(result);
    });
  });

  describe('factorSalarioReal', () => {
    it('returns salary times FSR constant', () => {
      expect(factorSalarioReal(100)).toBeCloseTo(100 * (1 + 0.2826), 2);
    });

    it('returns 0 for zero salary', () => {
      expect(factorSalarioReal(0)).toBe(0);
    });

    it('returns 0 for undefined', () => {
      expect(factorSalarioReal(undefined as any)).toBe(0);
    });
  });

  describe('fmtQ currency formatter', () => {
    it('formats GTQ with Q prefix', () => {
      expect(fmtQ(1234.5)).toBe('Q1,234.50');
    });

    it('handles zero', () => {
      expect(fmtQ(0)).toBe('Q0.00');
    });

    it('handles large numbers', () => {
      expect(fmtQ(1_000_000)).toBe('Q1,000,000.00');
    });

    it('handles undefined/NaN gracefully', () => {
      expect(fmtQ(undefined as any)).toBe('Q0.00');
      expect(fmtQ(NaN as any)).toBe('Q0.00');
    });
  });

  describe('Constants sanity', () => {
    it('IVA is 0.12', () => {
      expect(IVA).toBe(0.12);
    });

    it('ADMINISTRACION is 0.08', () => {
      expect(ADMINISTRACION).toBe(0.08);
    });

    it('IMPREVISTOS is 0.03', () => {
      expect(IMPREVISTOS).toBe(0.03);
    });

    it('HERRAMIENTA_MENOR is reasonable', () => {
      expect(HERRAMIENTA_MENOR).toBeGreaterThan(0);
      expect(HERRAMIENTA_MENOR).toBeLessThan(1);
    });
  });
});
