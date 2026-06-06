import React from 'react';
import { Card as AntCardComponent } from 'antd';
import type { CardProps as AntCardProps } from 'antd';

interface AntCardProps extends Omit<AntCardProps, 'title'> {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  hoverable?: boolean;
  extra?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
}

export const AntCard = React.forwardRef<HTMLDivElement, AntCardProps>(
  ({
    title,
    children,
    loading = false,
    hoverable = true,
    extra,
    bodyStyle,
    ...props
  }, ref) => {
    return (
      <AntCardComponent
        ref={ref}
        title={title}
        extra={extra}
        loading={loading}
        hoverable={hoverable}
        bodyStyle={{
          padding: '16px',
          ...bodyStyle,
        }}
        style={{
          borderRadius: '8px',
        }}
        {...props}
      >
        {children}
      </AntCardComponent>
    );
  }
);

AntCard.displayName = 'AntCard';

export default AntCard;
