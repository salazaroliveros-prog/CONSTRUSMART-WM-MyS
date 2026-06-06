import React from 'react';

// ============================================================
// ANIMACIONES CONDICIONALES PARA TARJETAS
// ============================================================

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  enabled?: boolean;
}

export const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, className = '', enabled = true }) => (
  <div
    className={`${enabled ? 'animate-fade-in' : ''} ${className}`}
    style={enabled ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
  >
    {children}
  </div>
);

interface SlideUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  enabled?: boolean;
}

export const SlideUp: React.FC<SlideUpProps> = ({ children, delay = 0, className = '', enabled = true }) => (
  <div
    className={`${enabled ? 'animate-slide-up' : ''} ${className}`}
    style={enabled ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
  >
    {children}
  </div>
);

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  enabled?: boolean;
}

export const ScaleIn: React.FC<ScaleInProps> = ({ children, delay = 0, className = '', enabled = true }) => (
  <div
    className={`${enabled ? 'animate-scale' : ''} ${className}`}
    style={enabled ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
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
      bg-card rounded-lg border border-border shadow-sm
      transition-all duration-300 ease-out
      ${hover ? 'lg:hover:shadow-lg lg:hover:shadow-primary/10 lg:hover:-translate-y-1 lg:hover:border-primary/20 active:scale-[0.98] sm:active:scale-100' : ''}
      animate-slide-up
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      ${className}
    `}
    role="region"
    tabIndex={0}
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
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ease-out relative overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  const variants = {
    primary: 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary hover:to-primary/80 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:scale-105',
    secondary: 'bg-secondary text-secondary-foreground border-2 border-secondary hover:bg-secondary/80 hover:border-secondary/70 hover:scale-105 shadow-sm hover:shadow-md',
    accent: 'bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent hover:to-accent/80 shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 hover:scale-105',
    danger: 'bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive hover:to-destructive/80 shadow-md shadow-destructive/20 hover:shadow-lg hover:shadow-destructive/30 hover:scale-105',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type="button"
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
      {title && <div className="text-sm font-semibold text-foreground/80 mb-2">{title}</div>}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={pad} x2={width - pad} y1={height - pad - t * graphH} y2={height - pad - t * graphH}
            stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4,4" />
        ))}
        {/* Planned area */}
        <path d={buildArea(plannedPath)} fill="hsl(var(--accent))" fillOpacity={0.1} />
        <path d={buildPath(plannedPath)} fill="none" stroke="hsl(var(--accent))" strokeWidth={2.5} strokeDasharray="8,4" strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.5s" fill="freeze" />
        </path>
        {/* Actual area */}
        <path d={buildArea(actualPath)} fill="hsl(var(--primary))" fillOpacity={0.15} />
        <path d={buildPath(actualPath)} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} strokeLinecap="round">
          <animate attributeName="stroke-dashoffset" from="1000" to="0" dur="1.5s" fill="freeze" />
        </path>
        {/* Actual dots */}
        {data.actual.map((v, i) => {
          const x = pad + (i / (data.actual.length - 1)) * graphW;
          const y = height - pad - (v / maxVal) * graphH;
          return (
            <circle key={i} cx={x} cy={y} r={3} fill="hsl(var(--primary))" className="hover:r-5 transition-all cursor-pointer">
              <title>{`${data.labels[i]}: ${v.toFixed(1)}%`}</title>
            </circle>
          );
        })}
        {/* Labels */}
        {data.labels.map((l, i) => (
          <text key={i} x={pad + (i / (data.labels.length - 1)) * graphW} y={height - 10}
            fontSize={9} textAnchor="middle" fill="hsl(var(--muted-foreground))">{l}</text>
        ))}
      </svg>
    </div>
  );
};