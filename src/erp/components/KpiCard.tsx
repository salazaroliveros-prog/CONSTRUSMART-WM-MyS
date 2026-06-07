import React, { useEffect, useRef, useState } from 'react';
import { Sparkline } from './Charts';

interface Props {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
  sparkData?: number[];
}

// Anima un número desde 0 hasta el valor final
function useCountUp(target: number, ms = 600): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (isNaN(target)) { setV(target); return; }
    let start: number;
    const id = requestAnimationFrame(function tick(t) {
      if (!start) start = t;
      const p = Math.min((t - start) / ms, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(target * ease);
      if (p < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [target, ms]);
  return v;
}

const KpiCard: React.FC<Props> = ({
  label, value, icon, trend, trendUp,
  accent = 'from-orange-500 to-amber-500',
  sparkData,
}) => {
  // Extrae número para animar si el value es numérico o tiene prefijo
  const numMatch = value.replace(/[Q%,\s]/g, '');
  const numVal = parseFloat(numMatch);
  const isNum = !isNaN(numVal);
  const prefix = value.match(/^[^0-9-]*/)?.[0] || '';
  const suffix = value.match(/[^0-9.]+$/)?.[0] || '';
  const animated = useCountUp(isNum ? numVal : 0);
  const displayVal = isNum
    ? `${prefix}${animated >= 1000 ? animated.toLocaleString('es', { maximumFractionDigits: 0 }) : animated.toFixed(numVal % 1 !== 0 ? 1 : 0)}${suffix}`
    : value;

  return (
    <div className={`
      relative bg-card rounded-2xl p-3 sm:p-4 border border-border/40
      shadow-sm hover:shadow-lg hover:-translate-y-0.5
      transition-all duration-300 overflow-hidden group
    `}>
      {/* Fondo glow sutil en hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />

      <div className="relative flex items-start justify-between">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${
            trendUp ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>

      <div className="relative mt-2 sm:mt-3">
        <div className="text-lg sm:text-xl font-black text-card-foreground leading-tight truncate tabular-nums">
          {displayVal}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>

      {sparkData && sparkData.length > 1 && (
        <div className="relative mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
          <Sparkline data={sparkData} color={`hsl(var(--primary))`} height={28} />
        </div>
      )}
    </div>
  );
};

export default KpiCard;
