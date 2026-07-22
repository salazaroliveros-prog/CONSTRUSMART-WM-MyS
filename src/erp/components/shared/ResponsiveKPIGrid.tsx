import React from 'react';

interface KPIItem {
  label: string;
  value: string | number;
  /** Optional secondary value */
  subValue?: string;
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  icon?: React.ReactNode;
  /** Optional trend indicator */
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}

interface ResponsiveKPIGridProps {
  items: KPIItem[];
  /** Columns on mobile (1 or 2) */
  mobileCols?: 1 | 2;
  /** Columns on tablet */
  tabletCols?: 2 | 3 | 4;
  /** Columns on desktop */
  desktopCols?: 3 | 4 | 6;
  className?: string;
}

const VARIANT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  default: { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' },
  success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  danger:  { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
  info:    { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
};

const TREND_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

const TREND_COLORS: Record<string, string> = {
  up: 'text-success',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
};

export const ResponsiveKPIGrid: React.FC<ResponsiveKPIGridProps> = ({
  items,
  mobileCols = 2,
  tabletCols = 3,
  desktopCols = 4,
  className = '',
}) => {
  const mobileGridClass = mobileCols === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const tabletGridClass = `sm:grid-cols-${tabletCols}`;
  const desktopGridClass = `lg:grid-cols-${desktopCols}`;

  return (
    <div className={`grid ${mobileGridClass} ${tabletGridClass} ${desktopGridClass} gap-2 sm:gap-3 ${className}`}>
      {items.map((item, idx) => {
        const style = VARIANT_STYLES[item.variant || 'default'];
        return (
          <div
            key={idx}
            className={`${style.bg} ${style.border} rounded-xl p-3 sm:p-4 border transition-all active:scale-[0.98]`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
                  {item.label}
                </p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${style.text} mt-0.5 truncate`}>
                  {item.value}
                </p>
                {item.subValue && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                    {item.subValue}
                  </p>
                )}
              </div>
              {item.icon && (
                <div className={`${style.bg} p-1.5 sm:p-2 rounded-lg shrink-0`}>
                  {item.icon}
                </div>
              )}
            </div>
            {item.trend && (
              <div className="flex items-center gap-1 mt-1.5">
                <span className={`text-xs font-bold ${TREND_COLORS[item.trend]}`}>
                  {TREND_ICONS[item.trend]}
                </span>
                {item.trendLabel && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {item.trendLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ResponsiveKPIGrid;