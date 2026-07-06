/**
 * Componentes de Skeleton Screen para estados de carga
 * 
 * Usa shimmer-enhanced y stagger para animaciones de carga fluidas.
 * Respeta prefers-reduced-motion y animations-disabled.
 */

import React from 'react';

interface SkeletonBaseProps {
  className?: string;
  delay?: number;
}

const SkeletonBar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`shimmer-enhanced rounded-lg ${className}`} />
);

export const SkeletonCard: React.FC<SkeletonBaseProps> = ({ className = '', delay = 0 }) => (
  <div
    className={`bg-card rounded-xl border border-border/40 p-4 card-elevation ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <SkeletonBar className="h-4 w-3/4 mb-3" />
    <SkeletonBar className="h-3 w-full mb-2" />
    <SkeletonBar className="h-3 w-5/6 mb-2" />
    <SkeletonBar className="h-3 w-2/3" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ rows = 5, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {/* Header */}
    <div className="flex gap-3 p-3">
      <SkeletonBar className="h-3 flex-1" />
      <SkeletonBar className="h-3 flex-1" />
      <SkeletonBar className="h-3 w-24" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex gap-3 p-3 rounded-lg"
        style={{ animationDelay: `${i * 50}ms` }}
      >
        <SkeletonBar className="h-3 flex-1" />
        <SkeletonBar className="h-3 flex-1" />
        <SkeletonBar className="h-3 w-24" />
      </div>
    ))}
  </div>
);

export const SkeletonStats: React.FC<{ count?: number; className?: string }> = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} delay={i * 80} />
    ))}
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ count = 5, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border/40"
        style={{ animationDelay: `${i * 60}ms` }}
      >
        <SkeletonBar className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBar className="h-3 w-3/4" />
          <SkeletonBar className="h-2.5 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonDashboard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-4 p-4 ${className}`}>
    <SkeletonStats count={4} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SkeletonCard delay={0} />
      <SkeletonCard delay={100} />
    </div>
    <SkeletonTable rows={6} />
  </div>
);

export const SkeletonForm: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="space-y-1.5" style={{ animationDelay: `${i * 50}ms` }}>
        <SkeletonBar className="h-2.5 w-1/4" />
        <SkeletonBar className="h-10 w-full rounded-xl" />
      </div>
    ))}
    <SkeletonBar className="h-10 w-32 rounded-xl mt-2" />
  </div>
);

export const SkeletonDetail: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/40">
      <SkeletonBar className="w-14 h-14 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBar className="h-4 w-3/4" />
        <SkeletonBar className="h-3 w-1/2" />
        <SkeletonBar className="h-3 w-1/4" />
      </div>
    </div>
    <SkeletonCard delay={50} />
    <SkeletonCard delay={100} />
  </div>
);

export const SkeletonWeather: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4 ${className}`}>
    <SkeletonBar className="h-6 w-48 mb-4" />
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 bg-card rounded-xl border border-border/40" style={{ animationDelay: `${i * 80}ms` }}>
          <SkeletonBar className="h-3 w-1/2 mb-3" />
          <SkeletonBar className="h-8 w-1/3 mb-2" />
          <SkeletonBar className="h-3 w-2/3" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div className="p-4 bg-card rounded-xl border border-border/40">
        <SkeletonBar className="h-4 w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBar className="h-20 rounded-xl" />
          <SkeletonBar className="h-20 rounded-xl" />
        </div>
      </div>
      <div className="p-4 bg-card rounded-xl border border-border/40">
        <SkeletonBar className="h-4 w-1/3 mb-4" />
        <div className="space-y-3">
          <SkeletonBar className="h-4 rounded-xl" />
          <SkeletonBar className="h-4 rounded-xl" />
        </div>
      </div>
    </div>
    <div className="p-4 bg-card rounded-xl border border-border/40">
      <SkeletonBar className="h-4 w-1/3 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-muted/30" style={{ animationDelay: `${i * 60}ms` }}>
            <SkeletonBar className="h-3 w-1/2 mb-2" />
            <SkeletonBar className="h-3 w-full mb-1" />
            <SkeletonBar className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  </div>
);