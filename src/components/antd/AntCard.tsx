import React from 'react';
import { Card as AntCardComponent } from 'antd';
import type { CardProps } from 'antd';

interface AntCardOwnProps {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  hoverable?: boolean;
  extra?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
}

export type AntCardProps = Omit<CardProps, 'title'> & AntCardOwnProps;

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
