import React from 'react';
import { useErp } from '../../store';
import { Card as AntCard } from 'antd';

export interface UICardProps {
  title?: React.ReactNode;
  subtitle?: string;
  extra?: React.ReactNode;
  hoverable?: boolean;
  size?: 'small' | 'default' | 'large';
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const UICard: React.FC<UICardProps> = ({
  title, subtitle, extra, hoverable, size = 'small',
  className = '', children, style, onClick,
}) => {
  const { appSettings } = useErp();

  if (appSettings.uiMode === 'antd') {
    const antSize = size === 'large' ? 'default' : size;
    return (
      <AntCard
        title={title}
        extra={extra}
        hoverable={hoverable}
        size={antSize as any}
        className={className}
        style={style}
        onClick={onClick}
      >
        {subtitle && <div className="text-muted-foreground" style={{ fontSize: 12, marginBottom: 12 }}>{subtitle}</div>}
        {children}
      </AntCard>
    );
  }

  return (
    <div
      className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm ${hoverable ? 'hover:shadow-md hover:border-primary/20 transition-all duration-300 cursor-pointer' : ''} ${size === 'small' ? 'p-4' : size === 'large' ? 'p-6 md:p-8' : 'p-4 md:p-6'} ${className}`}
      style={style}
      onClick={onClick}
    >
      {(title || extra) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground m-0 leading-snug">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 mb-0">{subtitle}</p>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default UICard;
