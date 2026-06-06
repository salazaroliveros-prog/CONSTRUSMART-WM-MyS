import React from 'react';
import { Button as AntButtonComponent, Tooltip } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';

export type ButtonSize = 'small' | 'middle' | 'large';
export type ButtonType = 'primary' | 'default' | 'dashed' | 'text' | 'link' | 'ghost';

interface AntButtonProps extends Omit<AntButtonProps, 'type' | 'size'> {
  type?: ButtonType;
  size?: ButtonSize;
  tooltip?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const AntButton = React.forwardRef<HTMLButtonElement, AntButtonProps>(
  ({ type = 'default', size = 'middle', tooltip, ...props }, ref) => {
    const button = (
      <AntButtonComponent
        ref={ref}
        type={type}
        size={size}
        {...props}
      />
    );

    if (tooltip) {
      return <Tooltip title={tooltip}>{button}</Tooltip>;
    }

    return button;
  }
);

AntButton.displayName = 'AntButton';

export default AntButton;
