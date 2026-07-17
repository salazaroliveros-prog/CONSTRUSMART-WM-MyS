# Soporte de Decimales con BigDecimal

## Descripción

CONSTRUSMART ERP ahora incluye soporte para cálculos financieros precisos usando `decimal.js` en lugar de aritmética de punto flotante (IEEE 754).

## Instalación

Las dependencias ya están instaladas:
- `decimal.js@10.6.0` - Librería de aritmética decimal precisa
- `@types/decimal.js` - Tipos TypeScript

## Uso Básico

### Importar utilidades

```typescript
import {
  toDecimal,
  sumar,
  restar,
  multiplicar,
  dividir,
  porcentaje,
  redondear,
  formatCurrency,
  formatPercentage,
  calcularMargenBruto,
  calcularUtilidadBruta,
  calculadoraFinanciera
} from '@/lib/decimalUtils';
```

### Ejemplos de uso

#### Operaciones básicas

```typescript
// Crear valor decimal
const costo = toDecimal(100.50);
const cantidad = toDecimal(5);

// Multiplicar
const total = multiplicar(costo, cantidad); // 502.50

// Sumar
const subtotal = sumar(toDecimal(100), toDecimal(50)); // 150

// Restar
const diferencia = restar(toDecimal(200), toDecimal(50)); // 150

// Dividir
const promedio = dividir(toDecimal(100), toDecimal(4)); // 25
```

#### Cálculos financieros

```typescript
// Calcular margen bruto
const ingreso = toDecimal(100000);
const costo = toDecimal(85000);
const margen = calcularMargenBruto(ingreso, costo); // 15%

// Calcular utilidad bruta
const utilidad = calcularUtilidadBruta(entregreso, costo); // 15000

// Calcular variación porcentual
const actual = toDecimal(115000);
const esperado = toDecimal(100000);
const variacion = calcularVariacion(actual, esperado); // 15
```

#### Formateo

```typescript
// Formatear como moneda
const valor = toDecimal(1234.56);
const formatted = formatCurrency(valor, 'GTQ'); // "Q 1,234.56"

// Formatear como porcentaje
const porc = toDecimal(15.5);
const formatted = formatPercentage(porc, 1); // "15.5%"
```

#### Calculadora financiera

```typescript
import { calculadoraFinanciera } from '@/lib/decimalUtils';

// Establecer valores
calculadoraFinanciera.setValor('costoMateriales', 5000);
calculadoraFinanciera.setValor('costoManoObra', 3000);
calculadoraFinanciera.setValor('costoEquipo', 1000);

// Calcular costo total
const costoTotal = calculadoraFinanciera.calcularCostoTotal(
  calculadoraFinanciera.getValor('costoMateriales'),
  calculadoraFinanciera.getValor('costoManoObra'),
  calculadoraFinanciera.getValor('costoEquipo')
); // 9000

// Calcular precio de venta con margen
const precioVenta = calculadoraFinanciera.calcularPrecioVenta(
  costoTotal,
  toDecimal(20) // 20% margen
); // 10800
```

## Integración con Código Existente

### Conversión con código existente

El código existente usa `number` para valores monetarios. Para usar `decimal.js` de forma gradual:

```typescript
// Código existente (sin modificar)
const costoTotal = monto1 + monto2;

// Nuevo código con precisión
const costoTotal = sumar(toDecimal(monto1), toDecimal(monto2));

// Para compatibilidad, convertir de vuelta a number si es necesario
const costoTotalNumber = fromDecimal(costoTotal);
```

### En el motor de cálculo

Actualizar el motor de cálculo para usar decimales:

```typescript
// Antes (motorCalculo.ts)
const costoCemento = cementoSacos * PRECIOS_REFERENCIALES.cementoSaco;

// Después
const costoCemento = multiplicar(
  toDecimal(cementoSacos),
  toDecimal(PRECIOS_REFERENCIALES.cementoSaco)
);
```

### En validación de cálculos

```typescript
// Antes
if (costoTotal < 0) {
  alertas.push({ tipo: 'critica', mensaje: 'Costo negativo' });
}

// Después
if (menorQue(costoTotalDecimal, toDecimal(0))) {
  alertas.push({ tipo: 'critica', mensaje: 'Costo negativo' });
}
```

## Ventajas de decimal.js

1. **Precisión**: Elimina errores de redondeo de IEEE 754
2. **Consistencia**: Mismos resultados en todas las plataformas
3. **Transparencia**: Comportamiento predecible en cálculos financieros
4. **Rendimiento**: Optimizado para operaciones financieras frecuentes

## Configuración

La configuración actual es:
- Precisión: 28 dígitos
- Redondeo: Half-up (bancario)
- Rango: ±1e15

Para cambiar la configuración global:

```typescript
import Decimal from 'decimal.js';

Decimal.set({
  precision: 20, // Menor precisión si no se necesita máxima
  rounding: 1, // Round down
});
```

## Pruebas

Para probar el soporte de decimales:

```typescript
import { describe, it, expect } from 'vitest';
import { toDecimal, sumar, multiplicar, calcularMargenBruto } from '@/lib/decimalUtils';

describe('Pruebas de decimales', () => {
  it('debería sumar correctamente', () => {
    const a = toDecimal(0.1);
    const b = toDecimal(0.2);
    const resultado = sumar(a, b);
    expect(resultado.toNumber()).toBeCloseTo(0.3);
  });

  it('debería calcular margen bruto correctamente', () => {
    const ingreso = toDecimal(100);
    const costo = toDecimal(85);
    const margen = calcularMargenBruto(ingreso, costo);
    expect(margen.toNumber()).toBe(15);
  });
});
```

## Migración Gradual

Para migrar el código existente a usar `decimal.js`:

1. **Fase 1**: Agregar import de utilidades decimales
2. **Fase 2**: Usar `toDecimal()` en nuevos cálculos
3. **Fase 3**: Actualizar motor de cálculo principal
4. **Fase 4**: Actualizar servicios de rentabilidad
5. **Fase 5**: Actualizar validación de cálculos

## Notas Importantes

- Los tipos TypeScript existentes usan `number` por compatibilidad
- Use `toDecimal()` para convertir a DecimalValue
- Use `fromDecimal()` para convertir de vuelta a number si es necesario
- Los cálculos críticos financieros deben usar siempre `decimal.js`
- Los cálculos no críticos pueden seguir usando `number` por simplicidad
