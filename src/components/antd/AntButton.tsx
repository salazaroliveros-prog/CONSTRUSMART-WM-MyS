import React from 'react';
import { Button as AntButtonComponent, Tooltip } from 'antd';
import type { ButtonProps } from 'antd';

export type ButtonSize = 'small' | 'middle' | 'large';

interface AntButtonOwnProps {
  type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
  size?: ButtonSize;
  tooltip?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export type AntButtonProps = Omit<ButtonProps, 'type' | 'size'> & AntButtonOwnProps;

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
