import React from 'react';
import { Drawer, Button, Space } from 'antd';
import type { DrawerProps } from 'antd';

interface AntDrawerOwnProps {
  title?: React.ReactNode;
  onClose: () => void;
  onSubmit?: () => void | Promise<void>;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  children: React.ReactNode;
}

type AntDrawerProps = Omit<DrawerProps, 'title'> & AntDrawerOwnProps;

const AntDrawer: React.FC<AntDrawerProps> = ({
  title,
  onClose,
  onSubmit,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  loading = false,
  children,
  ...props
}) => {
    return (
      <Drawer
        title={title}
        onClose={onClose}
        width={500}
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
};

export default AntDrawer;
