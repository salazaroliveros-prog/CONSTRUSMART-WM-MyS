import Decimal from 'decimal.js';
import { safeLogger } from '@/lib/safeLogger';

// Configurar Decimal.js para precisión financiera
Decimal.set({
  precision: 28, // Precisión máxima para cálculos financieros
  rounding: 4, // Redondeo bancario (half-up)
  toExpNeg: -15, // Notación científica para números muy pequeños
  toExpPos: 20, // Notación científica para números muy grandes
  maxE: 1e15, // Valor máximo exponencial
  minE: -1e15, // Valor mínimo exponencial
  modulo: 1e9, // Módulo para operaciones mod
});

// Tipo branded para asegurar uso correcto
export type DecimalValue = Decimal & { __brand: 'decimal' };

/**
 * Crea un DecimalValue desde un número o string
 */
export function toDecimal(value: number | string): DecimalValue {
  try {
    const decimal = new Decimal(value);
    return decimal as DecimalValue;
  } catch (error) {
    safeLogger.error('Error creando Decimal:', error);
    return new Decimal(0) as DecimalValue;
  }
}

/**
 * Suma dos valores decimales
 */
export function sumar(a: DecimalValue, b: DecimalValue): DecimalValue {
  return toDecimal(a).plus(b) as DecimalValue;
}

/**
 * Resta dos valores decimales
 */
export function restar(a: DecimalValue, b: DecimalValue): DecimalValue {
  return toDecimal(a).minus(b) as DecimalValue;
}

/**
 * Multiplica dos valores decimales
 */
export function multiplicar(a: DecimalValue, b: DecimalValue): DecimalValue {
  return toDecimal(a).times(b) as DecimalValue;
}

/**
 * Divide dos valores decimales
 */
export function dividir(a: DecimalValue, b: DecimalValue): DecimalValue {
  if (toDecimal(b).isZero()) {
    safeLogger.error('División por cero');
    return new Decimal(0) as DecimalValue;
  }
  return toDecimal(a).dividedBy(b) as DecimalValue;
}

/**
 * Calcula porcentaje
 */
export function porcentaje(valor: DecimalValue, total: DecimalValue): DecimalValue {
  if (toDecimal(total).isZero()) {
    return new Decimal(0) as DecimalValue;
  }
  return multiplicar(valor, toDecimal(100)).dividedBy(total) as DecimalValue;
}

/**
 * Redondea a un número específico de decimales
 */
export function redondear(valor: DecimalValue, decimales: number = 2): DecimalValue {
  return toDecimal(valor).toDecimalPlaces(decimales) as DecimalValue;
}

/**
 * Compara dos valores decimales
 * Returns: -1 si a < b, 0 si a == b, 1 si a > b
 */
export function comparar(a: DecimalValue, b: DecimalValue): number {
  return toDecimal(a).comparedTo(b);
}

/**
 * Verifica si dos valores son iguales
 */
export function igual(a: DecimalValue, b: DecimalValue): boolean {
  return comparar(a, b) === 0;
}

/**
 * Verifica si a es mayor que b
 */
export function mayorQue(a: DecimalValue, b: DecimalValue): boolean {
  return comparar(a, b) > 0;
}

/**
 * Verifica si a es menor que b
 */
export function menorQue(a: DecimalValue, b: DecimalValue): boolean {
  return comparar(a, b) < 0;
}

/**
 * Formatea DecimalValue a string con formato monetario
 */
export function formatCurrency(valor: DecimalValue, moneda: 'GTQ' | 'USD' = 'GTQ'): string {
  const valorRedondeado = redondear(valor, 2);
  const numero = valorRedondeado.toNumber();
  
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

/**
 * Formatea DecimalValue a string con formato porcentaje
 */
export function formatPercentage(valor: DecimalValue, decimales: number = 1): string {
  const valorRedondeado = redondear(valor, decimales);
  const numero = valorRedondeado.toNumber();
  
  return `${numero.toFixed(decimales)}%`;
}

/**
 * Calcula costo total con factores de ajuste
 */
export function calcularCostoAjustado(
  costoBase: DecimalValue,
  factores: DecimalValue[]
): DecimalValue {
  let costoAjustado = costoBase;
  
  for (const factor of factores) {
    costoAjustado = multiplicar(costoAjustado, factor);
  }
  
  return costoAjustado;
}

/**
 * Calcula variación porcentual entre valor actual y esperado
 */
export function calcularVariacion(
  valorActual: DecimalValue,
  valorEsperado: DecimalValue
): DecimalValue {
  if (toDecimal(valorEsperado).isZero()) {
    return new Decimal(0) as DecimalValue;
  }
  
  const diferencia = restar(valorActual, valorEsperado);
  return porcentaje(diferencia, valorEsperado);
}

/**
 * Calcula margen bruto
 */
export function calcularMargenBruto(
  ingreso: DecimalValue,
  costo: DecimalValue
): DecimalValue {
  const utilidad = restar(ingreso, costo);
  return porcentaje(utilidad, ingreso);
}

/**
 * Calcula utilidad bruta
 */
export function calcularUtilidadBruta(
  ingreso: DecimalValue,
  costo: DecimalValue
): DecimalValue {
  return restar(ingreso, costo);
}

/**
 * Convierte array de valores decimales a suma total
 */
export function sumarArray(valores: DecimalValue[]): DecimalValue {
  if (valores.length === 0) {
    return new Decimal(0) as DecimalValue;
  }
  
  return valores.reduce((acumulador, valor) => sumar(acumulador, valor), new Decimal(0) as DecimalValue);
}

/**
 * Convierte array de valores decimales a promedio
 */
export function promedioArray(valores: DecimalValue[]): DecimalValue {
  if (valores.length === 0) {
    return new Decimal(0) as DecimalValue;
  }
  
  const suma = sumarArray(valores);
  return dividir(suma, toDecimal(valores.length));
}

/**
 * Aplica factor de descuento
 */
export function aplicarDescuento(
  valor: DecimalValue,
  porcentajeDescuento: DecimalValue
): DecimalValue {
  const factorDescuento = dividir(porcentajeDescuento, toDecimal(100));
  const descuento = multiplicar(valor, factorDescuento);
  return restar(valor, descuento);
}

/**
 * Aplica factor de recargo
 */
export function aplicarRecargo(
  valor: DecimalValue,
  porcentajeRecargo: DecimalValue
): DecimalValue {
  const factorRecargo = dividir(porcentajeRecargo, toDecimal(100));
  const recargo = multiplicar(valor, factorRecargo);
  return sumar(valor, recargo);
}

/**
 * Calcula IVA (Impuesto al Valor Agregado)
 * Guatemala: 12%
 */
export function calcularIVA(valor: DecimalValue, tasaIVA: DecimalValue = toDecimal(0.12)): DecimalValue {
  return multiplicar(valor, tasaIVA);
}

/**
 * Calcula valor con IVA incluido
 */
export function calcularValorConIVA(valor: DecimalValue, tasaIVA: DecimalValue = toDecimal(0.12)): DecimalValue {
  const iva = calcularIVA(valor, tasaIVA);
  return sumar(valor, iva);
}

/**
 * Clase utilitaria para cálculos financieros precisos
 */
export class CalculadoraFinanciera {
  private valores: Map<string, DecimalValue>;

  constructor() {
    this.valores = new Map();
  }

  /**
   * Establece un valor con clave
   */
  setValor(clave: string, valor: number | string | DecimalValue): void {
    this.valores.set(clave, toDecimal(valor));
  }

  /**
   * Obtiene un valor por clave
   */
  getValor(clave: string): DecimalValue {
    return this.valores.get(clave) || toDecimal(0);
  }

  /**
   * Calcula suma de múltiples valores
   */
  sumarValores(claves: string[]): DecimalValue {
    return sumarArray(claves.map(key => this.getValor(key)));
  }

  /**
   * Calcula costo total de materiales
   */
  calcularCostoMateriales(
    cantidad: DecimalValue,
    precioUnitario: DecimalValue
  ): DecimalValue {
    return multiplicar(cantidad, precioUnitario);
  }

  /**
   * Calcula costo total de mano de obra
   */
  calcularCostoManoObra(
    horas: DecimalValue,
    tarifaPorHora: DecimalValue
  ): DecimalValue {
    return multiplicar(horas, tarifaPorHora);
  }

  /**
   * Calcula costo total con materiales y mano de obra
   */
  calcularCostoTotal(
    costoMateriales: DecimalValue,
    costoManoObra: DecimalValue,
    costoEquipo: DecimalValue = toDecimal(0),
    costoOtros: DecimalValue = toDecimal(0)
  ): DecimalValue {
    const subtotal = sumarArray([costoMateriales, costoManoObra, costoEquipo, costoOtros]);
    return subtotal;
  }

  /**
   * Calcula precio de venta con margen
   */
  calcularPrecioVenta(
    costoTotal: DecimalValue,
    margenPorcentaje: DecimalValue
  ): DecimalValue {
    const margenDecimal = dividir(margenPorcentaje, toDecimal(100));
    const margenValor = multiplicar(costoTotal, margenDecimal);
    return sumar(costoTotal, margenValor);
  }

  /**
   * Calcula precio de venta con sobrecosto
   */
  calcularPrecioVentaConSobrecosto(
    costoTotal: DecimalValue,
    margenPorcentaje: DecimalValue,
    sobrecostoPorcentaje: DecimalValue
  ): DecimalValue {
    const precioConMargen = this.calcularPrecioVenta(costoTotal, margenPorcentaje);
    return aplicarRecargo(precioConMargen, sobrecostoPorcentaje);
  }

  /**
   * Limpia todos los valores
   */
  limpiar(): void {
    this.valores.clear();
  }

  /**
   * Exporta todos los valores como objeto
   */
  exportar(): Record<string, number> {
    const resultado: Record<string, number> = {};
    this.valores.forEach((valor, clave) => {
      resultado[clave] = valor.toNumber();
    });
    return resultado;
  }
}

// Instancia singleton de calculadora financiera
export const calculadoraFinanciera = new CalculadoraFinanciera();
