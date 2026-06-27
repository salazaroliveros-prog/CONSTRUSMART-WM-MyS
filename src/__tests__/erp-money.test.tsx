import { describe, it, expect } from "vitest";
import { moneyFromNumber, moneySum, moneyFormat, moneyMultiply, moneyPercent, moneyCompare, moneyIsZero, moneyToNumber } from "../erp/money";

describe("Money", () => {
  it('should create from number safely', () => {
    expect(moneyFromNumber(10).toNumber()).toBeCloseTo(10);
  });

  it('should return zero for NaN/Infinity', () => {
    expect(moneyFromNumber(NaN).toNumber()).toBeCloseTo(0);
    expect(moneyFromNumber(Infinity).toNumber()).toBeCloseTo(0);
  });

  it('should sum items', () => {
    const items = [moneyFromNumber(1), moneyFromNumber(2)];
    expect(moneySum(items).toNumber()).toBeCloseTo(3);
  });

  it('should format currency GTQ vs USD', () => {
    expect(typeof moneyFormat(moneyFromNumber(1234.5), 'GTQ')).toBe('string');
    expect(moneyFormat(moneyFromNumber(500), 'USD')).toBe('$500.00');
  });

  it('should multiply and percent', () => {
    const m = moneyFromNumber(100);
    expect(moneyMultiply(m, 2).toNumber()).toBeCloseTo(200);
    expect(moneyPercent(m, 10).toNumber()).toBeCloseTo(10);
  });

  it('should compare and detect zero', () => {
    expect(moneyCompare(moneyFromNumber(0), moneyFromNumber(0))).toBe(0);
    expect(moneyIsZero(moneyFromNumber(0))).toBe(true);
    expect(moneyIsZero(moneyFromNumber(1))).toBe(false);
  });

});
