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
    bg: 'bg-success/15',
    text: 'text-success',
    border: 'border-success/40',
    icon: '✅',
  },
  warning: {
    bg: 'bg-warning/15',
    text: 'text-warning',
    border: 'border-warning/40',
    icon: '⚠️',
  },
  danger: {
    bg: 'bg-destructive/15',
    text: 'text-destructive',
    border: 'border-destructive/40',
    icon: '🔴',
  },
  info: {
    bg: 'bg-info/15',
    text: 'text-info',
    border: 'border-info/40',
    icon: 'ℹ️',
  },
  pending: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: '⏳',
  },
};

const sizeMap: Record<SizeType, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
};

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
    inline-flex items-center gap-1.5 rounded-full font-semibold font-jetbrains-mono
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
