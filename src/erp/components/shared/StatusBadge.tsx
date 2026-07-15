import React from 'react';

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'pending';
type SizeType = 'sm' | 'md' | 'lg';
type VariantType = 'solid' | 'outline' | 'ghost';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: SizeType;
  icon?: React.ReactNode;
  variant?: VariantType;
  className?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; border: string; icon?: string }> = {
  success: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    icon: '✅',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    icon: '⚠️',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    icon: '🔴',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    icon: 'ℹ️',
  },
  pending: {
    bg: 'bg-gray-100 dark:bg-gray-900/40',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-700',
    icon: '⏳',
  },
};

const sizeMap: Record<SizeType, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

/**
 * StatusBadge Component - Badge de estado con múltiples variantes
 * 
 * Características:
 * - 5 estados semánticos (success, warning, danger, info, pending)
 * - 3 variantes visuales (solid, outline, ghost)
 * - 3 tamaños (sm, md, lg)
 * - Icon automático o custom
 * - Accesible
 */
export function StatusBadge({
  status,
  label,
  size = 'md',
  icon,
  variant = 'solid',
  className = '',
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const baseClasses = `
    inline-flex items-center gap-1.5 rounded-full font-semibold
    transition-all duration-200
    ${sizeMap[size]}
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  `;

  let variantClasses = '';
  if (variant === 'solid') {
    variantClasses = `${config.bg} ${config.text}`;
  } else if (variant === 'outline') {
    variantClasses = `border ${config.border} ${config.text} bg-transparent`;
  } else if (variant === 'ghost') {
    variantClasses = `${config.text} bg-transparent opacity-70 hover:opacity-100`;
  }

  const displayIcon = icon || config.icon;

  return (
    <span
      className={`${baseClasses} ${variantClasses} ${className}`}
      role="status"
      aria-label={`${status}: ${label}`}
    >
      {displayIcon && <span className="flex-shrink-0">{displayIcon}</span>}
      <span>{label}</span>
    </span>
  );
}

export default StatusBadge;
