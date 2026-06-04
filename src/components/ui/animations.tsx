import React from 'react';

// ============================================================
// ANIMACIONES CONDICIONALES PARA TARJETAS
// ============================================================

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, className = '' }) => (
  <div
    className={`animate-fadeIn ${className}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    {children}
  </div>
);

interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const SlideUp: React.FC<SlideUpProps> = ({ children, delay = 0, className = '' }) => (
  <div
    className={`animate-slideUp ${className}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    {children}
  </div>
);

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ children, delay = 0, className = '' }) => (
  <div
    className={`animate-scaleIn ${className}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    {children}
  </div>
);

// ============================================================
// TARJETA CON ANIMACIONES
// ============================================================

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children, className = '', hover = true, delay = 0
}) => (
  <div
    className={`
      bg-card rounded-2xl border border-border shadow-sm
      transition-all duration-300 ease-out
      ${hover ? 'hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1 hover:border-orange-200' : ''}
      animate-slideUp
      ${className}
    `}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    {children}
  </div>
);

// ============================================================
// BOTÓN CON EFECTO HOVER REACTIVO
// ============================================================

interface GlowButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children, onClick, className = '', variant = 'primary', size = 'md', icon
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ease-out relative overflow-hidden group';

  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105',
    secondary: 'bg-white border-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-400 hover:scale-105 shadow-sm hover:shadow-md',
    accent: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 hover:scale-105',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && <span className="transition-transform duration-300 group-hover:scale-110">{icon}</span>}
      {children}
    </button>
  );
};

// ============================================================
// GRÁFICA S-CURVE INTERACTIVA
// ============================================================

interface SCurveData {
  labels: string[];
  planned: number[];
  actual: number[];
}

interface SCurveProps {
  data: SCurveData;
  width?: number;
  height?: number;
  title?: string;
}

export const SCurve: React.FC<SCurveProps> = ({ data, width = 400, height = 200, title }) => {
  const pad = 40;
  const graphW = width - pad * 2;
  const graphH = height - pad * 2;
  const maxVal = Math.max(...data.planned, ...data.actual, 100);

  const getPathPoints = (values: number[]) => {
    return values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * graphW;
      const y = height - pad - (v / maxVal) * graphH;
      return `${x},${y}`;
    });
  };

  const plannedPath = getPathPoints(data.planned);
  const actualPath = getPathPoints(data.actual);

  const buildPath = (points: string[]) => {
    if (points.length < 2) return '';
    return `M ${points.join(' L ')}`;
  };

  const buildArea = (points: string[]) => {
    if (points.length < 2) return '';
    return `M ${pad},${height - pad} L ${points.join(' L ')} L ${pad + graphW},${height - pad} Z`;
  };

  return (
    <div className="relative">
      {title && <div className="text-sm font-semibold text-slate-700 mb-2">{title}</div>}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={pad} x2={width - pad} y1={height - pad - t * graphH} y2={height - pad - t * graphH}
            stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4,4" />
        ))}
        {/* Planned area */}
        <path d={buildArea(plannedPath)} fill="#3b82f6" fillOpacity={0.1} />
        <path d={buildPath(plannedPath)} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="8,4" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.5s" fill="freeze" />
        </path>
        {/* Actual area */}
        <path d={buildArea(actualPath)} fill="#f97316" fillOpacity={0.15} />
        <path d={buildPath(actualPath)} fill="none" stroke="#f97316" strokeWidth={2.5} strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.5s" fill="freeze" />
        </path>
        {/* Actual dots */}
        {data.actual.map((v, i) => {
          const x = pad + (i / (data.actual.length - 1)) * graphW;
          const y = height - pad - (v / maxVal) * graphH;
          return (
            <circle key={i} cx={x} cy={y} r={3} fill="#f97316" className="hover:r-5 transition-all cursor-pointer">
              <title>{`${data.labels[i]}: ${v.toFixed(1)}%`}</title>
            </circle>
          );
        })}
        {/* Labels */}
        {data.labels.map((l, i) => (
          <text key={i} x={pad + (i / (data.labels.length - 1)) * graphW} y={height - 10}
            fontSize={9} textAnchor="middle" fill="#94a3b8">{l}</text>
        ))}
      </svg>
    </div>
  );
};