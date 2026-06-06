import React from 'react';
import { Drawer, Button, Space } from 'antd';
import type { DrawerProps } from 'antd';

interface AntDrawerProps extends Omit<DrawerProps, 'title'> {
  title?: React.ReactNode;
  onClose: () => void;
  onSubmit?: () => void | Promise<void>;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  children: React.ReactNode;
  size?: 'small' | 'default' | 'large';
}

const sizeMap: { [key: string]: number } = {
  small: 300,
  default: 500,
  large: 750,
};

export const AntDrawer = React.forwardRef<any, AntDrawerProps>(
  ({
    title,
    onClose,
    onSubmit,
    submitText = 'Guardar',
    cancelText = 'Cancelar',
    loading = false,
    children,
    size = 'default',
    ...props
  }, ref) => {
    return (
      <Drawer
        ref={ref}
        title={title}
        onClose={onClose}
        width={sizeMap[size] || sizeMap.default}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={onClose}>{cancelText}</Button>
            {onSubmit && (
              <Button
                type="primary"
                onClick={onSubmit}
                loading={loading}
              >
                {submitText}
              </Button>
            )}
          </Space>
        }
        {...props}
      >
        {children}
      </Drawer>
    );
  }
);

AntDrawer.displayName = 'AntDrawer';

export default AntDrawer;
