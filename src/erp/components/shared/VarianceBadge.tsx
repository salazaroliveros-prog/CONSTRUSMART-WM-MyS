import React from 'react';

interface VarianceBadgeProps {
  actual: number;
  planned: number;
  unit?: '%' | '$' | 'unidad' | 'horas';
  format?: (val: number) => string;
  showPercent?: boolean;
  className?: string;
}

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

  const statusColor = isPositive
    ? 'text-success bg-success/10 border border-success/20'
    : 'text-destructive bg-destructive/10 border border-destructive/20';

  const icon = isPositive ? '↑' : '↓';
  const displayValue = format ? format(variance) : variance.toFixed(1);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-jetbrains-mono
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
