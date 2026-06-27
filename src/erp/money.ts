import Decimal from 'decimal.js';
import { z } from 'zod';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type MoneyBrand = { readonly Money: unique symbol };
export type Money = Decimal & MoneyBrand;

export function Money(value: Decimal.Value): Money {
  return new Decimal(value) as Money;
}

export const moneySchema = z.custom<Money>((val) => val instanceof Decimal, {
  message: 'Debe ser un valor Money válido',
});

export function moneyFromNumber(value: number): Money {
  return Money(new Decimal(isFinite(value) ? value : 0));
}

export function moneySum(items: Money[]): Money {
  return Money(items.reduce((a, b) => a.plus(b), new Decimal(0)));
}

export function moneyFormat(amount: Money | number, currency: 'GTQ' | 'USD' = 'GTQ'): string {
  const d = typeof amount === 'number' ? new Decimal(isFinite(amount) ? amount : 0) : amount;
  const sym = currency === 'GTQ' ? 'Q' : '$';
  return `${sym}${d.toFormat(2)}`;
}

export function moneyMultiply(amount: Money, factor: number): Money {
  return Money(amount.times(factor));
}

export function moneyPercent(amount: Money, pct: number): Money {
  return Money(amount.times(pct).dividedBy(100));
}

export function moneyCompare(a: Money, b: Money): number {
  return a.comparedTo(b);
}

export function moneyIsZero(amount: Money): boolean {
  return amount.isZero();
}

export function moneyToNumber(amount: Money): number {
  return amount.toNumber();
}
