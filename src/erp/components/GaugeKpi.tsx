import React, { useEffect, useState } from 'react';
import { Database } from 'lucide-react';

interface GaugeKpiProps {
  label: string;
  sublabel?: string;
  value: number;
  displayValue: string;
  min?: number;
  max: number;
  color: string;
  zones?: { from: number; to: number; color: string }[];
  icon?: React.ReactNode;
  hasData: boolean;
  delay?: number;
  sparkData?: number[];
}

const DEFAULT_ZONES = (max: number) => [
  { from: 0, to: max * 0.3, color: 'hsl(var(--destructive))' },
  { from: max * 0.3, to: max * 0.7, color: 'hsl(var(--warning))' },
  { from: max * 0.7, to: max, color: 'hsl(var(--success))' },
];

function useNeedle(target: number, max: number, ms = 1200, delay = 0) {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const clampedTarget = Math.max(0, Math.min(target, max));
    const targetAngle = (clampedTarget / max) * 180 - 90;
    const timeout = setTimeout(() => {
      let start: number;
      let raf: number;
      const tick = (t: number) => {
        if (!start) start = t;
        const p = Math.min((t - start) / ms, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        setAngle(targetAngle * ease);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, max, ms, delay]);
  return angle;
}

const GaugeKpi: React.FC<GaugeKpiProps> = ({
  label, sublabel, value, displayValue, min = 0, max, color,
  zones: customZones, icon, hasData, delay = 0, sparkData,
}) => {
  const zones = customZones || DEFAULT_ZONES(max);
  const angle = useNeedle(value, max, 1200, delay);
  const [hovered, setHovered] = useState(false);
  const svgW = 160;
  const svgH = 100;
  const cx = svgW / 2;
  const cy = 85;
  const r = 65;

  const arcStart = -180;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl bg-card border border-border/40 shadow-sm h-full min-h-[100px]">
        <Database className="w-5 h-5 text-muted-foreground/30 mb-1" />
        <span className="text-[10px] text-muted-foreground/50 font-medium text-center leading-tight">Sin datos<br/>en Supabase</span>
      </div>
    );
  }

  const describeArc = (startA: number, endA: number) => {
    const s = (startA * Math.PI) / 180;
    const e = (endA * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    const large = Math.abs(endA - startA) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleRad = (angle * Math.PI) / 180;
  const nx = cx + (r - 8) * Math.cos(needleRad);
  const ny = cy + (r - 8) * Math.sin(needleRad);

  return (
    <div
      className={`flex flex-col items-center p-1.5 sm:p-2 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group cursor-default h-full`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-full flex items-center justify-between mb-0.5 px-1">
        <span className="text-[10px] sm:text-xs font-bold text-card-foreground truncate">{label}</span>
        {icon && (
          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-sm flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-h-[70px] sm:max-h-[80px]" role="img" aria-label={`Gauge: ${label}`}>
        <defs>
          <filter id={`glow-${label.replace(/\s/g, '')}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {zones.map((z, i) => {
          const sA = arcStart + ((z.from - min) / (max - min || 1)) * 180;
          const eA = arcStart + ((z.to - min) / (max - min || 1)) * 180;
          return (
            <path key={i} d={describeArc(sA, eA)}
              fill="none" stroke={z.color} strokeWidth={10} strokeLinecap="round"
              opacity={0.2 + (i === 0 && value < z.to ? 0.3 : 0) + (i === 1 && value >= z.from && value < z.to ? 0.3 : 0) + (i === 2 && value >= z.from ? 0.3 : 0)}
            />
          );
        })}

        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke="hsl(var(--foreground))" strokeWidth={2.5} strokeLinecap="round"
          filter={hovered ? `url(#glow-${label.replace(/\s/g, '')})` : undefined}
          style={{ transition: 'all 0.1s' }}
        />
        <circle cx={cx} cy={cy} r={4} fill="hsl(var(--foreground))" />
        <circle cx={cx} cy={cy} r={2} fill="hsl(var(--card))" />

        <text x={cx} y={cy - 18} fontSize={16} fontWeight="900" textAnchor="middle"
          fill="hsl(var(--foreground))" className="tabular-nums">
          {displayValue}
        </text>

        {sparkData && sparkData.length > 1 && (
          <g transform={`translate(${cx - 35}, ${cy - 14})`}>
            {(() => {
              const w = 70, h = 12;
              const mx = Math.max(...sparkData, 1);
              const mn = Math.min(...sparkData, 0);
              const pts = sparkData.map((v, i) => {
                const px = (i / (sparkData.length - 1)) * w;
                const py = h - ((v - mn) / (mx - mn || 1)) * h;
                return `${px},${py}`;
              }).join(' ');
              return <polyline points={pts} fill="none" stroke={color.includes('from-') ? 'currentColor' : color} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />;
            })()}
          </g>
        )}
      </svg>

      {sublabel && (
        <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5 text-center truncate w-full">{sublabel}</span>
      )}
    </div>
  );
};

export default React.memo(GaugeKpi);