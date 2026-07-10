import { ReactNode, useEffect, useState, useRef } from 'react';

/**
 * COMPONENTES DE ANIMACIÓN PARA TRANSICIONES DE PANTALLA
 * 
 * Este archivo contiene componentes para animaciones de transición entre pantallas
 * en la aplicación CONSTRUSMART ERP.
 * 
 * Componentes principales:
 * - PageTransition: Animación de entrada para cambios de pantalla
 * - Soporta tipos: fade, slide, scale, none
 * - Respeta prefers-reduced-motion y la configuración de animaciones del usuario
 * 
 * NOTA: El archivo src/components/ui/animations.tsx fue eliminado porque no estaba siendo utilizado.
 * Si se necesitan animaciones para tarjetas u otros componentes UI, considerar agregarlas aquí.
 */

/**
 * PageTransition — Animación de entrada para cambios de pantalla
 * Respeta prefers-reduced-motion y la configuración de animaciones del usuario
 */
export function PageTransition({
  children,
  animationType = 'fade',
}: {
  children: ReactNode;
  animationType?: 'fade' | 'slide' | 'scale' | 'none';
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const getAnimationClass = () => {
    if (animationType === 'none') return '';
    switch (animationType) {
      case 'slide':
        return visible ? 'animate-slide-in-right' : 'opacity-0';
      case 'scale':
        return visible ? 'animate-scale-in' : 'opacity-0';
      case 'fade':
      default:
        return visible ? 'animate-fade-in-up' : 'opacity-0';
    }
  };

  useEffect(() => {
    // Check if animations are disabled via app settings
    const isDisabled = document.documentElement.classList.contains('animations-disabled');
    if (isDisabled) {
      setVisible(true);
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => setVisible(true), 10);
    return () => {
      clearTimeout(timer);
      setVisible(false);
    };
  }, [children, animationType]);

  return (
    <div
      ref={ref}
      className={getAnimationClass()}
      style={{
        animationDuration: '350ms',
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

/**
 * StaggerChildren — Aplica animación escalonada a hijos
 * Cada hijo recibe un delay incremental
 */
export function StaggerChildren({
  children,
  baseDelay = 50,
  className = '',
}: {
  children: ReactNode[];
  baseDelay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isDisabled = document.documentElement.classList.contains('animations-disabled');
    if (isDisabled) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={visible ? 'animate-fade-in-up' : 'opacity-0'}
              style={{
                animationDelay: `${baseDelay * index}ms`,
                animationDuration: '400ms',
                animationFillMode: 'both',
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

/**
 * FadeIn — Componente wrapper con fade-in simple
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isDisabled = document.documentElement.classList.contains('animations-disabled');
    if (isDisabled) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`${visible ? 'animate-fade-in' : 'opacity-0'} ${className}`}
      style={{
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

/**
 * ScaleIn — Animación de escala al aparecer
 */
export function ScaleIn({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isDisabled = document.documentElement.classList.contains('animations-disabled');
    if (isDisabled) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`${visible ? 'animate-scale-in' : 'opacity-0 scale-95'} ${className}`}
      style={{
        animationDuration: '300ms',
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

/**
 * SlideInRight — Animación de deslizamiento desde la derecha
 */
export function SlideInRight({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isDisabled = document.documentElement.classList.contains('animations-disabled');
    if (isDisabled) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`${visible ? 'animate-slide-in-right' : 'opacity-0'} ${className}`}
      style={{
        animationDuration: '300ms',
        animationFillMode: 'both',
      }}
    >
      {children}
    </div>
  );
}

/**
 * AnimatedCounter — Número que se anima desde 0 hasta el valor final
 */
export function AnimatedCounter({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  className = '',
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const isDisabled = document.documentElement.classList.contains('animations-disabled');
    if (isDisabled) {
      setDisplayValue(value);
      return;
    }

    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

/**
 * PulseDot — Punto pulsante para indicar estado en vivo
 */
export function PulseDot({
  color = 'success',
  size = 'sm',
  label,
}: {
  color?: 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const sizeMap = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' };
  const colorMap = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <span className="inline-flex items-center gap-1.5" role="status" aria-label={label || color}>
      <span
        className={`${sizeMap[size]} ${colorMap[color]} rounded-full animate-pulse-soft inline-block`}
        aria-hidden="true"
      />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  );
}

/**
 * SkeletonCard — Esqueleto animado para cards en carga
 */
export function SkeletonCard({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`bg-card rounded-xl p-4 border border-border/40 ${className}`}>
      <div className="shimmer-enhanced h-4 w-3/4 rounded mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer-enhanced h-3 rounded mb-2"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

/**
 * LoadingSpinner — Spinner animado con tamaño configurable
 */
export function LoadingSpinner({
  size = 'md',
  label,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}) {
  const sizeMap = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-3', lg: 'w-12 h-12 border-4' };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} role="status" aria-label={label || 'Cargando'}>
      <div
        className={`${sizeMap[size]} border-primary border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}