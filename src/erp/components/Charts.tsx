import React, { useState, useEffect } from 'react';

// ─── Color Palettes ──────────────────────────────────────────────────
export const PALETTES: Record<string, string[]> = {
  default: ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'],
  warm:    ['#ef4444', '#f97316', '#fbbf24', '#f59e0b', '#d97706', '#b45309'],
  cool:    ['#3a86ff', '#06b6d4', '#10b981', '#6366f1', '#8b5cf6', '#a855f7'],
  mono:    ['#6b7280', '#9ca3af', '#d1d5db', '#4b5563', '#374151', '#1f2937'],
  vivid:   ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ffbe0b', '#fb5607'],
};
export type PaletteName = keyof typeof PALETTES;
export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];
export type BarDatum = { label: string; value: number; color?: string };
export type DonutDatum = { label: string; value: number; color: string };

function pickColor(index: number, palette?: PaletteName, explicit?: string): string {
  if (explicit) return explicit;
  const pal = palette ? PALETTES[palette] || PALETTES.default : PALETTES.default;
  return pal[index % pal.length];
}

const W = 320, H = 180, PAD = 28;

interface Series { label: string; color: string; data: number[]; }
interface TooltipState { x: number; y: number; content: string; visible: boolean; }

// Hook animacion entrada (0→1 en `ms` ms)
function useAnimIn(ms = 700) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let start: number;
    const id = requestAnimationFrame(function tick(t) {
      if (!start) start = t;
      const progress = Math.min((t - start) / ms, 1);
      // ease-out-cubic
      setP(1 - Math.pow(1 - progress, 3));
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [ms]);
  return p;
}

// Tooltip flotante
const Tooltip: React.FC<TooltipState> = ({ x, y, content, visible }) => {
  if (!visible) return null;
  return (
    <g>
      <rect
        x={x - 36} y={y - 28} width={72} height={20} rx={4}
        fill="hsl(var(--foreground))" opacity={0.9}
      />
      <text x={x} y={y - 14} fontSize={8} textAnchor="middle" fill="hsl(var(--background))" fontWeight="600">
        {content}
      </text>
    </g>
  );
};

export const LineChart: React.FC<{
  series: Series[]; labels?: string[]; height?: number;
}> = React.memo(({ series, labels, height = H }) => {
  const p = useAnimIn(800);
  const [tip, setTip] = useState<TooltipState>({ x: 0, y: 0, content: '', visible: false });
  const clean = series.map(s => ({ ...s, data: s.data.filter((v): v is number => Number.isFinite(v)).map(v => Math.max(0, Math.min(100, v))) }));
  const all = clean.flatMap(s => s.data);
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const n = Math.max(...clean.map(s => s.data.length), 2);
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (n - 1);
  const y = (v: number): number => {
    const nv = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
    return height - PAD - ((nv - min) / (max - min || 1)) * (height - PAD * 2);
  };

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="Gráfico de líneas">
      <defs>
        {clean.map((s, si) => (
          <linearGradient key={si} id={`lg-line-${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={PAD} x2={W - PAD}
          y1={PAD + t * (height - PAD * 2)} y2={PAD + t * (height - PAD * 2)}
          stroke="hsl(var(--border))" strokeWidth={0.8} strokeDasharray="3 3" />
      ))}
      {/* Area + línea animada */}
      {clean.map((s, si) => {
        const pts = s.data.map((v, i) => [x(i), y(v)] as [number, number]);
        const visiblePts = pts.slice(0, Math.max(2, Math.round(pts.length * p)));
        const line = visiblePts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px} ${py}`).join(' ');
        const area = `${line} L ${visiblePts[visiblePts.length - 1][0]} ${height - PAD} L ${visiblePts[0][0]} ${height - PAD} Z`;
        return (
          <g key={si}>
            <path d={area} fill={`url(#lg-line-${si})`} />
            <path d={line} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round"
              strokeLinecap="round" />
            {pts.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r={i < visiblePts.length ? 4 : 0}
                fill={s.color} stroke="hsl(var(--card))" strokeWidth={1.5}
                style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                onMouseEnter={() => setTip({ x: px, y: py, content: `${s.label}: ${s.data[i]}`, visible: true })}
                onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}
              />
            ))}
          </g>
        );
      })}
      {labels && labels.map((l, i) => (
        <text key={i} x={x(i)} y={height - 8} fontSize={8} textAnchor="middle"
          fill="hsl(var(--muted-foreground))">{l}</text>
      ))}
      <Tooltip {...tip} />
    </svg>
  );
});
LineChart.displayName = 'LineChart';

export const AreaChart: React.FC<{ series: Series[]; labels?: string[] }> = React.memo(({ series, labels }) => {
  const p = useAnimIn(900);
  const [tip, setTip] = useState<TooltipState>({ x: 0, y: 0, content: '', visible: false });
  const all = series.flatMap(s => s.data);
  const max = Math.max(...all, 1);
  const n = Math.max(...series.map(s => s.data.length), 2);
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (n - 1);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de área">
      <defs>
        {series.map((s, si) => (
          <linearGradient key={si} id={`lg-area-${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
          </linearGradient>
        ))}
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={PAD} x2={W - PAD}
          y1={PAD + t * (H - PAD * 2)} y2={PAD + t * (H - PAD * 2)}
          stroke="hsl(var(--border))" strokeWidth={0.8} strokeDasharray="3 3" />
      ))}
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => [x(i), y(v)] as [number, number]);
        const vis = pts.slice(0, Math.max(2, Math.round(pts.length * p)));
        const line = vis.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px} ${py}`).join(' ');
        const area = `${line} L ${vis[vis.length - 1][0]} ${H - PAD} L ${vis[0][0]} ${H - PAD} Z`;
        return (
          <g key={si}>
            <path d={area} fill={`url(#lg-area-${si})`} />
            <path d={line} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
            {pts.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r={i < vis.length ? 3.5 : 0}
                fill={s.color} stroke="hsl(var(--card))" strokeWidth={1.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTip({ x: px, y: py, content: `${s.label}: ${s.data[i]}`, visible: true })}
                onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}
              />
            ))}
          </g>
        );
      })}
      {labels && labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 8} fontSize={8} textAnchor="middle"
          fill="hsl(var(--muted-foreground))">{l}</text>
      ))}
      <Tooltip {...tip} />
    </svg>
  );
});
AreaChart.displayName = 'AreaChart';

export const BarChart: React.FC<{
  data: { label: string; value: number; color?: string }[]; height?: number; palette?: PaletteName;
}> = React.memo(({ data, height = H, palette }) => {
  const p = useAnimIn(700);
  const [tip, setTip] = useState<TooltipState>({ x: 0, y: 0, content: '', visible: false });
  const max = Math.max(...data.map(d => d.value), 1);
  const bw = (W - PAD * 2) / Math.max(data.length, 1);

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label="Gráfico de barras">
      <defs>
        {data.map((d, i) => {
          const c = pickColor(i, palette, d.color);
          return (
            <linearGradient key={i} id={`lg-bar-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="1" />
              <stop offset="100%" stopColor={c} stopOpacity="0.6" />
            </linearGradient>
          );
        })}
      </defs>
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={PAD} x2={W - PAD}
          y1={PAD + (1 - t) * (height - PAD * 2)} y2={PAD + (1 - t) * (height - PAD * 2)}
          stroke="hsl(var(--border))" strokeWidth={0.7} strokeDasharray="3 3" />
      ))}
        {data.map((d, i) => {
        const c = pickColor(i, palette, d.color);
        const value = Math.max(0, Number.isFinite(d.value) ? d.value : 0);
        const fullH = Math.max(0, (value / max) * (height - PAD * 2));
        const animH = fullH * p;
        const bx = PAD + i * bw + bw * 0.12;
        const bwInner = bw * 0.76;
        return (
          <g key={i}
            onMouseEnter={() => setTip({ x: bx + bwInner / 2, y: height - PAD - animH - 4, content: `${d.label}: ${d.value}`, visible: true })}
            onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}
            style={{ cursor: 'pointer' }}>
            <rect x={bx} y={height - PAD - animH} width={bwInner} height={animH}
              rx={3} fill={`url(#lg-bar-${i})`} />
            {p > 0.95 && (
              <text x={bx + bwInner / 2} y={height - PAD - fullH - 4}
                fontSize={7} textAnchor="middle" fill={c} fontWeight="600">
                {value}
              </text>
            )}
            <text x={bx + bwInner / 2} y={height - 8} fontSize={7}
              textAnchor="middle" fill="hsl(var(--muted-foreground))">{d.label}</text>
          </g>
        );
      })}
      <Tooltip {...tip} />
    </svg>
  );
});
BarChart.displayName = 'BarChart';

export const Donut: React.FC<{
  data: { label: string; value: number; color: string }[]; size?: number;
}> = React.memo(({ data, size = 150 }) => {
  const p = useAnimIn(900);
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((a, b) => a + b.value, 0) || 0;
  const hasZero = data.some(d => d.value === 0);
  const effectiveData = hasZero && total > 0
    ? data.map(d => ({ ...d, value: d.value === 0 ? Math.max(total * 0.01, 0.5) : d.value }))
    : data;
  const effectiveTotal = effectiveData.reduce((a, b) => a + b.value, 0) || 1;
  const r = size / 2 - 12, cx = size / 2, cy = size / 2;
  let acc = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px] h-auto mx-auto" role="img" aria-label="Gráfico donut"
      style={{ maxWidth: Math.max(size, 60) }}>
      {effectiveData.map((d, i) => {
        const startAng = (acc / effectiveTotal) * 2 * Math.PI;
        acc += d.value;
        const endAng = (acc / effectiveTotal) * 2 * Math.PI;
        const { large, scale, x1, y1, x2, y2 } = (() => {
          const animEnd = startAng + (endAng - startAng) * p;
          const large = animEnd - startAng > Math.PI ? 1 : 0;
          const scale = hovered === i ? 1.06 : 1;
          const x1 = cx + r * Math.sin(startAng) * scale, y1 = cy - r * Math.cos(startAng) * scale;
          const x2 = cx + r * Math.sin(animEnd) * scale, y2 = cy - r * Math.cos(animEnd) * scale;
          return { large, scale, x1, y1, x2, y2 };
        })();
        const isReal = data[i]?.value === 0;
        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r * scale} ${r * scale} 0 ${large} 1 ${x2} ${y2} Z`;
        return (
          <path key={i} d={path} fill={isReal ? '#e2e8f0' : d.color}
            stroke="#fff" strokeWidth={hovered === i ? 2 : 1.5}
            style={{ cursor: 'pointer', transition: 'all 0.2s', filter: hovered === i ? `drop-shadow(0 2px 6px ${d.color}66)` : 'none', opacity: isReal ? 0.6 : 1 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <title>{d.label}: {data[i]?.value === 0 ? '0' : Math.round(d.value / effectiveTotal * 100)}%</title>
          </path>
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.52} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={1} />
      {total === 0 && (
        <text x={cx} y={cy + 3} fontSize={9} textAnchor="middle" fontWeight="600" fill="#94a3b8">
          Sin datos
        </text>
      )}
      {hovered !== null && total > 0 && (
        <text x={cx} y={cy + 4} fontSize={9} textAnchor="middle" fontWeight="700"
          fill={data[hovered]?.value === 0 ? '#94a3b8' : effectiveData[hovered]?.color}>
          {data[hovered]?.value === 0 ? '0%' : `${Math.round((effectiveData[hovered]?.value || 0) / effectiveTotal * 100)}%`}
        </text>
      )}
    </svg>
  );
});
Donut.displayName = 'Donut';

export const Gauge: React.FC<{
  value: number; max: number; label: string; color?: string;
}> = React.memo(({ value, max, label, color = '#10b981' }) => {
  const p = useAnimIn(1000);
  const pct = Math.max(-1, Math.min(1, value / (max || 1)));
  const angle = pct * 90 * p;
  const r = 60, cx = 80, cy = 80;
  const rad = (angle - 90) * Math.PI / 180;
  const nx = cx + r * Math.cos(rad), ny = cy + r * Math.sin(rad);

  return (
    <svg viewBox="0 0 160 100" className="w-full" role="img" aria-label={`Gauge: ${label}`}>
      <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="hsl(var(--border))"
        strokeWidth={12} strokeLinecap="round" />
      <path d="M 20 80 A 60 60 0 0 1 80 20" fill="none" stroke="hsl(var(--destructive))"
        strokeWidth={12} opacity={0.35} />
      <path d="M 80 20 A 60 60 0 0 1 140 80" fill="none" stroke={color}
        strokeWidth={12} opacity={0.35} />
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="hsl(var(--foreground))" strokeWidth={3} strokeLinecap="round"
        style={{ transition: 'all 0.05s' }} />
      <circle cx={cx} cy={cy} r={5} fill="hsl(var(--foreground))" />
      <text x={80} y={97} fontSize={9} textAnchor="middle" fill="hsl(var(--muted-foreground))">{label}</text>
    </svg>
  );
});
Gauge.displayName = 'Gauge';

export const Progress: React.FC<{
  value: number; color?: string; bg?: string; className?: string;
}> = React.memo(({ value, color = 'hsl(var(--primary))', bg = 'hsl(var(--border))', className }) => {
  const p = useAnimIn(600);
  const animVal = value * p;
  const safeColor = color.endsWith('cc') ? color : color.endsWith('66') ? color : `${color}cc`;
  const safeShadow = color.endsWith('66') ? color : `${color}66`;
  return (
    <div className={"w-full h-2.5 rounded-full overflow-hidden" + (className ? ` ${className}` : '')} style={{ background: bg }}>
      <div className="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, animVal))}%`,
          background: `linear-gradient(90deg, ${color}, ${safeColor})`,
          boxShadow: `0 0 8px ${safeShadow}`,
          transition: 'width 0.05s',
        }} />
    </div>
  );
});
Progress.displayName = 'Progress';

// ─── Configurable Line/Area (soporta cambio de tipo + paleta) ──────
export const ConfigurableLineArea: React.FC<{
  series: Series[];
  labels?: string[];
  type?: 'line' | 'area';
  palette?: PaletteName;
  height?: number;
}> = React.memo(({ series: rawSeries, labels, type = 'line', palette, height = H }) => {
  const p = useAnimIn(800);
  const [tip, setTip] = useState<TooltipState>({ x: 0, y: 0, content: '', visible: false });
  const ser = rawSeries.map((s, i) => ({ ...s, color: pickColor(i, palette, s.color), data: s.data.filter((v): v is number => Number.isFinite(v)).map(v => Math.max(0, Math.min(100, v))) }));
  const all = ser.flatMap(s => s.data).filter((v): v is number => Number.isFinite(v)).map(v => Math.max(0, Math.min(100, v)));
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const n = Math.max(...ser.map(s => s.data.length), 2);
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (n - 1);
  const y = (v: number): number => {
    const nv = Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0;
    return height - PAD - ((nv - min) / (max - min || 1)) * (height - PAD * 2);
  };
  const isArea = type === 'area';

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-full" role="img" aria-label="Gráfico configurable">
      <defs>
        {ser.map((s, si) => (
          <linearGradient key={si} id={`cfg-lg-${si}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={isArea ? 0.4 : 0.3} />
            <stop offset="100%" stopColor={s.color} stopOpacity={isArea ? 0.02 : 0} />
          </linearGradient>
        ))}
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={PAD} x2={W - PAD}
          y1={PAD + t * (height - PAD * 2)} y2={PAD + t * (height - PAD * 2)}
          stroke="hsl(var(--border))" strokeWidth={0.8} strokeDasharray="3 3" />
      ))}
      {ser.map((s, si) => {
        const pts = s.data.map((v, i) => [x(i), y(v)] as [number, number]);
        const vis = pts.slice(0, Math.max(2, Math.round(pts.length * p)));
        const line = vis.map(([px, py], i) => `${i === 0 ? 'M' : 'L'} ${px} ${py}`).join(' ');
        const area = isArea
          ? `${line} L ${vis[vis.length - 1][0]} ${height - PAD} L ${vis[0][0]} ${height - PAD} Z`
          : '';
        return (
          <g key={si}>
            {isArea && <path d={area} fill={`url(#cfg-lg-${si})`} />}
            <path d={line} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {!isArea && (
              <path d={`M ${pts[0][0]} ${pts[0][1]} L ${pts[0][0]} ${height - PAD} L ${vis[vis.length - 1][0]} ${height - PAD} L ${vis[vis.length - 1][0]} ${vis[vis.length - 1][1]} Z`}
                fill={`url(#cfg-lg-${si})`} opacity={0.25} />
            )}
            {pts.map(([px, py], i) => (
              <circle key={i} cx={px} cy={py} r={i < vis.length ? 4 : 0}
                fill={s.color} stroke="hsl(var(--card))" strokeWidth={1.5}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setTip({ x: px, y: py, content: `${s.label}: ${s.data[i]}`, visible: true })}
                onMouseLeave={() => setTip(t => ({ ...t, visible: false }))}
              />
            ))}
          </g>
        );
      })}
      {labels && labels.map((l, i) => (
        <text key={i} x={x(Math.round(i * (n - 1) / (labels.length - 1)))} y={height - 8}
          fontSize={8} textAnchor="middle" fill="hsl(var(--muted-foreground))">{l}</text>
      ))}
      <Tooltip {...tip} />
    </svg>
  );
});
ConfigurableLineArea.displayName = 'ConfigurableLineArea';

// Sparkline inline
export const Sparkline: React.FC<{
  data: number[]; color?: string; height?: number;
}> = React.memo(({ data, color = 'hsl(var(--primary))', height = 40 }) => {
  const p = useAnimIn(600);
  if (data.length < 2) return null;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const w = 80;
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (v: number) => height - ((v - min) / (max - min || 1)) * height;
  const vis = data.slice(0, Math.max(2, Math.round(data.length * p)));
  const line = vis.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const area = `${line} L ${x(vis.length - 1)} ${height} L ${x(0)} ${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sp-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sp-grad)" />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
});
Sparkline.displayName = 'Sparkline';
