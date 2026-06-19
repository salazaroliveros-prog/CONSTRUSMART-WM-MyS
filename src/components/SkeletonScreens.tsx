/**
 * Componentes de Skeleton Screen para estados de carga
 * 
 * Proporciona UI de carga visual atractiva mientras se cargan datos
 */

import React from 'react';
import { Skeleton } from 'antd';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 bg-card rounded-lg shadow-sm border ${className}`}>
    <Skeleton active paragraph={{ rows: 3 }} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ rows = 5, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton.Input key={i} active size="large" className="w-full" />
    ))}
  </div>
);

export const SkeletonStats: React.FC<{ count?: number; className?: string }> = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ count = 5, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-3 bg-card rounded-lg">
        <Skeleton.Avatar active size="default" />
        <div className="flex-1">
          <Skeleton.Input active size="small" className="w-3/4 mb-2" />
          <Skeleton.Input active size="small" className="w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonDashboard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    <SkeletonStats count={4} />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <SkeletonTable rows={8} />
  </div>
);

export const SkeletonForm: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i}>
        <Skeleton.Input active size="small" className="w-1/4 mb-2" />
        <Skeleton.Input active />
      </div>
    ))}
    <Skeleton.Button active className="w-32" />
  </div>
);

export const SkeletonDetail: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-start space-x-4">
      <Skeleton.Avatar active size="large" />
      <div className="flex-1">
        <Skeleton.Input active size="large" className="w-3/4 mb-2" />
        <Skeleton.Input active size="small" className="w-1/2 mb-2" />
        <Skeleton.Input active size="small" className="w-1/4" />
      </div>
    </div>
    <SkeletonCard />
    <SkeletonCard />
  </div>
);
