import { describe, it, expect } from 'vitest';
import {
  toPercent,
  calculateAvance,
  calculateAverage,
  calculateVariance,
  calculateROI,
  isValidPercentage,
  normalizePercentage,
  calculateMovementSum,
  calculateBalance,
  calculateMargin,
  validatePercentageSum,
} from '../utils/calculations';

describe('calculations', () => {
  describe('toPercent', () => {
    it('rounds to 0 decimals by default', () => {
      expect(toPercent(12.34)).toBe(12);
      expect(toPercent(12.56)).toBe(13);
    });

    it('rounds to requested decimals', () => {
      expect(toPercent(12.345, 2)).toBe(12.35);
      expect(toPercent(12.344, 2)).toBe(12.34);
    });

    it('returns 0 for non-finite values', () => {
      expect(toPercent(NaN)).toBe(0);
      expect(toPercent(Infinity)).toBe(0);
      expect(toPercent(-Infinity)).toBe(0);
    });
  });

  describe('calculateAvance', () => {
    it('returns 0 when total is 0', () => {
      expect(calculateAvance(5, 0)).toBe(0);
    });

    it('calculates percentage correctly', () => {
      expect(calculateAvance(1, 2)).toBe(50);
      expect(calculateAvance(3, 4)).toBe(75);
    });

    it('respects decimals', () => {
      expect(calculateAvance(1, 3, 2)).toBe(33.33);
    });
  });

  describe('calculateAverage', () => {
    it('returns 0 for empty array', () => {
      expect(calculateAverage([])).toBe(0);
    });

    it('calculates average correctly', () => {
      expect(calculateAverage([1, 2, 3])).toBe(2);
      expect(calculateAverage([10, 20], 2)).toBe(15);
    });

    it('rounds to requested decimals', () => {
      expect(calculateAverage([1, 2, 3], 1)).toBe(2);
      expect(calculateAverage([1, 3], 2)).toBe(2);
    });
  });

  describe('calculateVariance', () => {
    it('returns actual - expected rounded', () => {
      expect(calculateVariance(100, 110)).toBe(10);
      expect(calculateVariance(100, 99, 1)).toBe(-1);
    });
  });

  describe('calculateROI', () => {
    it('returns 0 when investment is 0', () => {
      expect(calculateROI(100, 0)).toBe(0);
    });

    it('calculates ROI percentage', () => {
      expect(calculateROI(50, 100)).toBe(50);
      expect(calculateROI(150, 100)).toBe(150);
    });
  });

  describe('isValidPercentage', () => {
    it('accepts values in 0-100', () => {
      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
    });

    it('rejects values outside 0-100', () => {
      expect(isValidPercentage(-1)).toBe(false);
      expect(isValidPercentage(101)).toBe(false);
      expect(isValidPercentage(NaN)).toBe(false);
    });
  });

  describe('normalizePercentage', () => {
    it('clamps values to 0-100', () => {
      expect(normalizePercentage(-10)).toBe(0);
      expect(normalizePercentage(150)).toBe(100);
      expect(normalizePercentage(50)).toBe(50);
    });

    it('returns 0 for non-finite values', () => {
      expect(normalizePercentage(NaN)).toBe(0);
      expect(normalizePercentage(Infinity)).toBe(0);
    });
  });

  describe('calculateMovementSum', () => {
    const movimientos = [
      { tipo: 'ingreso', monto: 100 },
      { tipo: 'egreso', monto: 50 },
      { tipo: 'ingreso', monto: 200 },
      { tipo: 'egreso', monto: 80 },
    ];

    it('sums all when tipo is *', () => {
      expect(calculateMovementSum(movimientos)).toBe(430);
      expect(calculateMovementSum(movimientos, '*')).toBe(430);
    });

    it('sums only matching tipo', () => {
      expect(calculateMovementSum(movimientos, 'ingreso')).toBe(300);
      expect(calculateMovementSum(movimientos, 'egreso')).toBe(130);
    });

    it('returns 0 for non-array input', () => {
      expect(calculateMovementSum(null as any)).toBe(0);
      expect(calculateMovementSum(undefined as any)).toBe(0);
    });

    it('handles missing monto as 0', () => {
      expect(calculateMovementSum([{ tipo: 'ingreso' } as any])).toBe(0);
    });
  });

  describe('calculateBalance', () => {
    it('returns ingresos - egresos', () => {
      const movimientos = [
        { tipo: 'ingreso', monto: 100 },
        { tipo: 'egreso', monto: 30 },
        { tipo: 'ingreso', monto: 50 },
      ];
      expect(calculateBalance(movimientos)).toBe(120);
    });

    it('returns 0 for empty array', () => {
      expect(calculateBalance([])).toBe(0);
    });
  });

  describe('calculateMargin', () => {
    it('returns 0 when ingresos is 0', () => {
      expect(calculateMargin(0, 100)).toBe(0);
    });

    it('calculates margin percentage', () => {
      expect(calculateMargin(100, 80)).toBe(20);
      expect(calculateMargin(200, 150)).toBe(25);
    });

    it('respects decimals', () => {
      expect(calculateMargin(100, 33.33, 2)).toBeCloseTo(66.67, 1);
    });
  });

  describe('validatePercentageSum', () => {
    it('accepts sums within tolerance', () => {
      expect(validatePercentageSum([40, 30, 30])).toBe(true);
      expect(validatePercentageSum([50, 50])).toBe(true);
    });

    it('rejects sums outside tolerance', () => {
      expect(validatePercentageSum([50, 51])).toBe(false);
      expect(validatePercentageSum([100.2])).toBe(false);
    });

    it('uses custom tolerance', () => {
      expect(validatePercentageSum([50.5, 49.5], 0.6)).toBe(true);
      expect(validatePercentageSum([60, 50], 0.4)).toBe(false);
    });
  });
});
