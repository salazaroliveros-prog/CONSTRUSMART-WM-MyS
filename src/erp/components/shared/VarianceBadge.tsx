import React from 'react';

interface VarianceBadgeProps {
  actual: number;
  planned: number;
  unit?: '%' | '$' | 'unidad' | 'horas';
  format?: (val: number) => string;
  showPercent?: boolean;
  className?: string;
}

/**
 * VarianceBadge Component - Muestra variancia respecto a plan
 * 
 * Características:
 * - Cálculo automático de variancia
 * - Colorización semántica (rojo/verde)
 * - Icono de dirección (↑/↓)
 * - Unidades flexibles
 * - Formato custom opcional
 */
export function VarianceBadge({
  actual,
  planned,
  unit = '%',
  format,
  showPercent = true,
  className = '',
}: VarianceBadgeProps) {
  const variance = actual - planned;
  const variancePercent = planned !== 0 ? (variance / planned) * 100 : 0;
  const isPositive = variance >= 0;

  // Determinar color según contexto
  // Para %, tiempo: positivo es malo (aumentó)
  // Para dinero gastado: positivo es malo (gastó más)
  // Pero para ingresos: positivo es bueno
  // Simplicidad: >0 = verde (generalmente bueno), <0 = rojo (generalmente malo)
  
  const statusColor = isPositive
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';

  const icon = isPositive ? '↑' : '↓';
  const displayValue = format ? format(variance) : variance.toFixed(1);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
        ${statusColor} transition-all duration-200
        ${className}
      `}
      role="status"
      aria-label={`Variancia: ${isPositive ? 'positiva' : 'negativa'} ${Math.abs(variance).toFixed(1)}${unit}`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{displayValue}{unit}</span>
      {showPercent && (
        <span className="opacity-70">
          ({variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
        </span>
      )}
    </span>
  );
}

export default VarianceBadge;
