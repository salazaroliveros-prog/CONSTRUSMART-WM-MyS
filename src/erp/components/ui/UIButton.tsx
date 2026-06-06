import React from 'react';
import { useErp } from '../../store';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';

export interface UIButtonProps extends Omit<AntButtonProps, 'type'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

const UIButton: React.FC<UIButtonProps> = ({ variant = 'primary', size = 'medium', className = '', children, ...props }) => {
  const { appSettings } = useErp();

  if (appSettings.uiMode === 'antd') {
    const typeMap: Record<string, AntButtonProps['type']> = {
      primary: 'primary',
      secondary: 'default',
      danger: 'primary',
      ghost: 'text',
      outline: 'default',
    };
    const dangerMap: Record<string, boolean> = {
      danger: true,
    };
    return (
      <AntButton
        type={typeMap[variant] || 'default'}
        danger={dangerMap[variant] || false}
        size={size === 'medium' ? 'middle' : size as any}
        className={className}
        {...props}
      >
        {children}
      </AntButton>
    );
  }

  const variantClasses: Record<string, string> = {
    primary: 'bg-[var(--primary)] text-white hover:brightness-110',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    danger: 'bg-destructive text-destructive-foreground hover:brightness-110',
    ghost: 'bg-transparent hover:bg-accent/20 text-foreground',
    outline: 'border border-border bg-transparent hover:bg-accent/10 text-foreground',
  };

  const sizeClasses: Record<string, string> = {
    small: 'px-3 py-1 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.medium} ${className}`}
      {...(props as any)}
    >
      {children}
    </button>
  );
};

export default UIButton;
