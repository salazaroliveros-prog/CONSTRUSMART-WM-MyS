import React from 'react';

interface Props {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
}

const KpiCard: React.FC<Props> = ({
  label,
  value,
  icon,
  trend,
  trendUp,
  accent = 'from-orange-500 to-amber-500',
}) => (
  <div className="bg-card text-card-foreground rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-sm shrink-0`}
        aria-hidden="true">
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          trendUp
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
        }`}>
          {trend}
        </span>
      )}
    </div>
    <div className="mt-3">
      <div className="text-xl font-bold text-foreground leading-tight truncate">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  </div>
);

export default KpiCard;
