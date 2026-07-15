import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendData {
  percentage: number;
  direction: 'up' | 'down' | 'flat';
  period: string;
}

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: TrendData;
  icon?: React.ReactNode;
  sparklineData?: number[];
  status?: 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  className?: string;
}

const statusStyles = {
  success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

const statusTextStyles = {
  success: 'text-emerald-700 dark:text-emerald-300',
  warning: 'text-amber-700 dark:text-amber-300',
  danger: 'text-red-700 dark:text-red-300',
  info: 'text-blue-700 dark:text-blue-300',
};

const trendIconStyles = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  flat: 'text-muted-foreground',
};

/**
 * KPICard Component - Tarjeta de indicador clave con trend y sparkline
 * 
 * Características:
 * - Trend indicator (↑/↓/→)
 * - Sparkline mini gráfico
 * - Status semántico (color)
 * - Clickeable (opcional)
 * - Responsive
 */
export function KPICard({
  label,
  value,
  trend,
  icon,
  sparklineData,
  status = 'info',
  onClick,
  className = '',
}: KPICardProps) {
  const trendColor = trend
    ? trend.direction === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend.direction === 'down'
      ? 'text-red-600 dark:text-red-400'
      : 'text-muted-foreground'
    : '';

  const trendArrow = trend
    ? trend.direction === 'up'
      ? '↑'
      : trend.direction === 'down'
      ? '↓'
      : '→'
    : '';

  const maxSparklineValue = sparklineData && sparklineData.length > 0
    ? Math.max(...sparklineData)
    : 0;

  return (
    <div
      onClick={onClick}
      className={`
        border rounded-xl p-4 transition-all duration-200
        ${statusStyles[status]}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''}
        ${className}
      `}
      role={onClick ? 'button' : 'region'}
      aria-label={`${label}: ${value}`}
    >
      {/* Header: Label + Icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        {icon && (
          <div className={`w-5 h-5 ${statusTextStyles[status]} flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value - Prominent */}
      <div className={`text-3xl font-bold ${statusTextStyles[status]} mb-2`}>
        {value}
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className={`text-sm font-semibold ${trendColor} mb-2 flex items-center gap-1`}>
          <span>{trendArrow}</span>
          <span>{Math.abs(trend.percentage).toFixed(1)}%</span>
          <span className="text-muted-foreground text-xs font-normal">
            ({trend.period})
          </span>
        </div>
      )}

      {/* Sparkline Chart */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3 h-10 flex items-end gap-0.5" role="img" aria-label="Trend chart">
          {sparklineData.map((value, idx) => {
            const height = maxSparklineValue > 0
              ? (value / maxSparklineValue) * 100
              : 0;
            const isPositive = value >= (sparklineData[sparklineData.length - 1] ?? 0);
            
            return (
              <div
                key={idx}
                className={`
                  flex-1 rounded-sm opacity-60 hover:opacity-100 transition-opacity
                  ${status === 'success' ? 'bg-emerald-400' : 'bg-blue-400'}
                  ${!isPositive && status === 'warning' ? 'bg-amber-400' : ''}
                  ${!isPositive && status === 'danger' ? 'bg-red-400' : ''}
                `}
                style={{ height: `${Math.max(height, 10)}%` }}
                title={`${value.toFixed(1)}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default KPICard;
