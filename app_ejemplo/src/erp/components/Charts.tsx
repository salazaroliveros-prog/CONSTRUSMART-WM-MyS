import React from 'react';

const W = 320, H = 180, PAD = 28;

interface Series { label: string; color: string; data: number[]; }

export const LineChart: React.FC<{ series: Series[]; labels?: string[]; height?: number }> = ({ series, labels, height = H }) => {
  const all = series.flatMap(s => s.data);
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const n = Math.max(...series.map(s => s.data.length), 2);
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (n - 1);
  const y = (v: number) => height - PAD - ((v - min) / (max - min || 1)) * (height - PAD * 2);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={PAD} x2={W - PAD} y1={PAD + t * (height - PAD * 2)} y2={PAD + t * (height - PAD * 2)} stroke="#e2e8f0" strokeWidth={1} />
      ))}
      {series.map((s, si) => {
        const d = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" />
            {s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={s.color} />)}
          </g>
        );
      })}
      {labels && labels.map((l, i) => (
        <text key={i} x={x(i)} y={height - 8} fontSize={8} textAnchor="middle" fill="#94a3b8">{l}</text>
      ))}
    </svg>
  );
};

export const AreaChart: React.FC<{ series: Series[]; labels?: string[] }> = ({ series, labels }) => {
  const all = series.flatMap(s => s.data);
  const max = Math.max(...all, 1);
  const n = Math.max(...series.map(s => s.data.length), 2);
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (n - 1);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {series.map((s, si) => {
        const line = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
        const area = `${line} L ${x(s.data.length - 1)} ${H - PAD} L ${x(0)} ${H - PAD} Z`;
        return (
          <g key={si}>
            <path d={area} fill={s.color} opacity={0.15} />
            <path d={line} fill="none" stroke={s.color} strokeWidth={2.5} />
          </g>
        );
      })}
      {labels && labels.map((l, i) => (
        <text key={i} x={x(i)} y={H - 8} fontSize={8} textAnchor="middle" fill="#94a3b8">{l}</text>
      ))}
    </svg>
  );
};

export const BarChart: React.FC<{ data: { label: string; value: number; color?: string }[]; height?: number }> = ({ data, height = H }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const bw = (W - PAD * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full">
      {data.map((d, i) => {
        const h = (d.value / max) * (height - PAD * 2);
        return (
          <g key={i}>
            <rect x={PAD + i * bw + bw * 0.15} y={height - PAD - h} width={bw * 0.7} height={h} rx={3} fill={d.color || '#f97316'} />
            <text x={PAD + i * bw + bw * 0.5} y={height - 8} fontSize={7} textAnchor="middle" fill="#94a3b8">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

export const Donut: React.FC<{ data: { label: string; value: number; color: string }[]; size?: number }> = ({ data, size = 150 }) => {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  let acc = 0;
  const r = size / 2 - 10, cx = size / 2, cy = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {data.map((d, i) => {
        const start = (acc / total) * 2 * Math.PI;
        acc += d.value;
        const end = (acc / total) * 2 * Math.PI;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.sin(start), y1 = cy - r * Math.cos(start);
        const x2 = cx + r * Math.sin(end), y2 = cy - r * Math.cos(end);
        return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={d.color} stroke="#fff" strokeWidth={1.5} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#fff" />
    </svg>
  );
};

export const Gauge: React.FC<{ value: number; max: number; label: string; color?: string }> = ({ value, max, label, color = '#10b981' }) => {
  const pct = Math.max(-1, Math.min(1, value / (max || 1)));
  const angle = pct * 90; // -90..90
  const r = 60, cx = 80, cy = 80;
  const rad = (angle - 90) * Math.PI / 180;
  const nx = cx + r * Math.cos(rad), ny = cy + r * Math.sin(rad);
  return (
    <svg viewBox="0 0 160 100" className="w-full">
      <path d={`M 20 80 A 60 60 0 0 1 140 80`} fill="none" stroke="#e2e8f0" strokeWidth={12} strokeLinecap="round" />
      <path d={`M 20 80 A 60 60 0 0 1 80 20`} fill="none" stroke="#ef4444" strokeWidth={12} opacity={0.4} />
      <path d={`M 80 20 A 60 60 0 0 1 140 80`} fill="none" stroke={color} strokeWidth={12} opacity={0.4} />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1e293b" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill="#1e293b" />
      <text x={80} y={97} fontSize={9} textAnchor="middle" fill="#64748b">{label}</text>
    </svg>
  );
};

export const Progress: React.FC<{ value: number; color?: string; bg?: string }> = ({ value, color = '#f97316', bg = '#e2e8f0' }) => (
  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: bg }}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
  </div>
);
