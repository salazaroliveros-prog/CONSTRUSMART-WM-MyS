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

const statusStyles: Record<string, string> = {
  success: 'bg-success/10 border-success/30 dark:bg-success/10 dark:border-success/20',
  warning: 'bg-warning/10 border-warning/30 dark:bg-warning/10 dark:border-warning/20',
  danger: 'bg-destructive/10 border-destructive/30 dark:bg-destructive/10 dark:border-destructive/20',
  info: 'bg-info/10 border-info/30 dark:bg-info/10 dark:border-info/20',
};

const statusTextStyles: Record<string, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  info: 'text-info',
};

const statusSparklineStyles: Record<string, string> = {
  success: 'bg-success/60',
  warning: 'bg-warning/60',
  danger: 'bg-destructive/60',
  info: 'bg-info/60',
};

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
      ? 'text-success'
      : trend.direction === 'down'
      ? 'text-destructive'
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
        border rounded-[18px] p-4 transition-all duration-200
        ${statusStyles[status]}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''}
        ${className}
      `}
      role={onClick ? 'button' : 'region'}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-jetbrains-mono">
          {label}
        </span>
        {icon && (
          <div className={`w-5 h-5 ${statusTextStyles[status]} flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      <div className={`text-3xl font-bold ${statusTextStyles[status]} mb-2`}>
        {value}
      </div>

      {trend && (
        <div className={`text-sm font-semibold ${trendColor} mb-2 flex items-center gap-1`}>
          <span>{trendArrow}</span>
          <span>{Math.abs(trend.percentage).toFixed(1)}%</span>
          <span className="text-muted-foreground text-xs font-normal font-jetbrains-mono">
            ({trend.period})
          </span>
        </div>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3 h-10 flex items-end gap-0.5" role="img" aria-label="Trend chart">
          {sparklineData.map((v, idx) => {
            const height = maxSparklineValue > 0
              ? (v / maxSparklineValue) * 100
              : 0;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-sm opacity-60 hover:opacity-100 transition-opacity ${statusSparklineStyles[status]}`}
                style={{ height: `${Math.max(height, 10)}%` }}
                title={`${v.toFixed(1)}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default KPICard;
