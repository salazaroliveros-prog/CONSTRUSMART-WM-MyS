// Extensión de tipos para soporte de decimales
// Este archivo extiende los tipos existentes para incluir soporte de decimal.js

import { Decimal } from 'decimal.js';

// Tipo branded para valores decimales en cálculos financieros
export type DecimalValue = Decimal & { __brand: 'decimal' };

// Extender tipos existentes para usar DecimalValue donde corresponde
declare module '@/erp/types' {
  interface Movimiento {
    monto?: number | DecimalValue;
  }

  interface Proyecto {
    presupuestoTotal?: number | DecimalValue;
    montoContrato?: number | DecimalValue;
  }

  interface Presupuesto {
    total?: number | DecimalValue;
  }

  interface OrdenCompra {
    total?: number | DecimalValue;
  }

  interface CuentaCobrar {
    monto?: number | DecimalValue;
  }

  interface CuentaPagar {
    monto?: number | DecimalValue;
  }

  interface CotizacionCliente {
    montoTotal?: number | DecimalValue;
  }

  interface PagoProveedor {
    monto?: number | DecimalValue;
  }

  interface ValeSalida {
    monto?: number | DecimalValue;
  }

  interface RecepcionAlmacen {
    costoTotal?: number | DecimalValue;
  }

  interface Material {
    precioUnitario?: number | DecimalValue;
    stock?: number | DecimalValue;
  }

  interface Empleado {
    salarioDiario?: number | DecimalValue;
  }

  interface ResultadoDosificacion {
    cementoSacos?: number | DecimalValue;
    arenaM3?: number | DecimalValue;
    piedraM3?: number | DecimalValue;
    aguaLt?: number | DecimalValue;
    costoTotal?: number | DecimalValue;
    desgloseCostos?: {
      cemento?: number | DecimalValue;
      arena?: number | DecimalValue;
      piedra?: number | DecimalValue;
    };
  }

  interface ResultadoMovimientoTierra {
    costoUnitario?: number | DecimalValue;
    costoTotal?: number | DecimalValue;
  }

  interface ResultadoPavimento {
    costoSuperficieM2?: number | DecimalValue;
    costoBaseM3?: number | DecimalValue;
    costoSelloM2?: number | DecimalValue;
    costoTotalM2?: number | DecimalValue;
    costoTotal?: number | DecimalValue;
  }

  interface ResultadoRedInfraestructura {
    costoUnitarioMl?: number | DecimalValue;
    costoTotal?: number | DecimalValue;
  }

  interface ResultadoMuroContencion {
    costoUnitarioM2?: number | DecimalValue;
    costoTotal?: number | DecimalValue;
  }

  interface ProjectProfitability {
    presupuestoTotal?: number | DecimalValue;
    costoReal?: number | DecimalValue;
    ingresoReal?: number | DecimalValue;
    utilidadBruta?: number | DecimalValue;
    margenBruto?: number | DecimalValue;
    variacionPresupuesto?: number | DecimalValue;
  }

  interface ClientProfitability {
    valorTotalContratos?: number | DecimalValue;
    costoTotalReal?: number | DecimalValue;
    utilidadTotal?: number | DecimalValue;
    margenPromedio?: number | DecimalValue;
    valorVidaCliente?: number | DecimalValue;
  }

  interface ResourceEfficiency {
    costoPlaneado?: number | DecimalValue;
    costoReal?: number | DecimalValue;
  }

  interface PricingOptimization {
    precioSugeridoBase?: number | DecimalValue;
    precioOptimizado?: number | DecimalValue;
  }
}

// Utilidad para convertir número a DecimalValue
export function asDecimal(value: number | string): DecimalValue {
  return new Decimal(value) as DecimalValue;
}

// Utilidad para convertir DecimalValue a número (para compatibilidad)
export function fromDecimal(value: DecimalValue): number {
  return value.toNumber();
}
