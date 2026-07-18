/**
 * calculations.ts - Utilidades de cálculo para ConstruSmart ERP
 * 
 * Proporciona funciones de cálculo consistentes para:
 * - Porcentajes (redondeo consistente)
 * - Promedios
 * - Varianzas
 * - Rentabilidad
 */

/**
 * Redondea un valor a un número específico de decimales
 * @param value Valor a redondear
 * @param decimals Número de decimales (default: 0)
 * @returns Valor redondeado
 */
export const toPercent = (value: number, decimals: number = 0): number => {
  if (!isFinite(value)) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
};

/**
 * Calcula porcentaje de avance manteniendo consistencia
 * @param completados Elementos completados
 * @param total Total de elementos
 * @param decimals Decimales a mantener (default: 0)
 * @returns Porcentaje redondeado
 */
export const calculateAvance = (completados: number, total: number, decimals: number = 0): number => {
  if (total === 0) return 0;
  const percentage = (completados / total) * 100;
  return toPercent(percentage, decimals);
};

/**
 * Calcula promedio de valores
 * @param values Array de valores
 * @param decimals Decimales a mantener (default: 2)
 * @returns Promedio redondeado
 */
export const calculateAverage = (values: number[], decimals: number = 2): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  return toPercent(average, decimals);
};

/**
 * Calcula varianza (desviación entre dos valores)
 * @param expected Valor esperado
 * @param actual Valor actual
 * @param decimals Decimales a mantener (default: 1)
 * @returns Varianza redondeada
 */
export const calculateVariance = (expected: number, actual: number, decimals: number = 1): number => {
  const variance = actual - expected;
  return toPercent(variance, decimals);
};

/**
 * Calcula rentabilidad (ROI)
 * @param profit Ganancia neta
 * @param investment Inversión inicial
 * @param decimals Decimales a mantener (default: 1)
 * @returns ROI redondeado
 */
export const calculateROI = (profit: number, investment: number, decimals: number = 1): number => {
  if (investment === 0) return 0;
  const roi = (profit / investment) * 100;
  return toPercent(roi, decimals);
};

/**
 * Valida que un valor sea un porcentaje válido (0-100)
 * @param value Valor a validar
 * @returns true si es válido, false en caso contrario
 */
export const isValidPercentage = (value: number): boolean => {
  return isFinite(value) && value >= 0 && value <= 100;
};

/**
 * Normaliza un valor de porcentaje al rango 0-100
 * @param value Valor a normalizar
 * @returns Valor normalizado entre 0 y 100
 */
export const normalizePercentage = (value: number): number => {
  if (!isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

/**
 * Calcula suma de movimientos por tipo (ingreso/egreso)
 * @param movimientos Array de movimientos
 * @param tipo Tipo de movimiento ('ingreso' | 'egreso' | '*')
 * @returns Suma total
 */
export const calculateMovementSum = (
  movimientos: Array<{ tipo: string; monto: number }>,
  tipo: string = '*'
): number => {
  if (!Array.isArray(movimientos)) return 0;
  
  if (tipo === '*') {
    return movimientos.reduce((sum, m) => sum + (m.monto || 0), 0);
  }
  
  return movimientos
    .filter((m) => m.tipo === tipo)
    .reduce((sum, m) => sum + (m.monto || 0), 0);
};

/**
 * Calcula balance (ingresos - egresos)
 * @param movimientos Array de movimientos
 * @returns Balance total
 */
export const calculateBalance = (movimientos: Array<{ tipo: string; monto: number }>): number => {
  const ingresos = calculateMovementSum(movimientos, 'ingreso');
  const egresos = calculateMovementSum(movimientos, 'egreso');
  return ingresos - egresos;
};

/**
 * Calcula margen (beneficio / ingresos * 100)
 * @param ingresos Total de ingresos
 * @param gastos Total de gastos
 * @param decimals Decimales a mantener (default: 1)
 * @returns Margen porcentual
 */
export const calculateMargin = (ingresos: number, gastos: number, decimals: number = 1): number => {
  if (ingresos === 0) return 0;
  const margen = ((ingresos - gastos) / ingresos) * 100;
  return toPercent(margen, decimals);
};

/**
 * Valida que todos los porcentajes en un array sumen 100%
 * @param percentages Array de porcentajes
 * @param tolerance Tolerancia de desviación (default: 0.1)
 * @returns true si suman 100%, false en caso contrario
 */
export const validatePercentageSum = (percentages: number[], tolerance: number = 0.1): boolean => {
  const sum = percentages.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 100) <= tolerance;
};

export default {
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
};
