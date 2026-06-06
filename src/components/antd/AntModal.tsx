import React from 'react';
import { Modal as AntModalComponent, Spin } from 'antd';
import type { ModalProps as AntModalProps } from 'antd';

interface AntModalProps extends Omit<AntModalProps, 'title'> {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  width?: number | string;
}

export const AntModal = React.forwardRef<any, AntModalProps>(
  ({
    title,
    children,
    loading = false,
    onConfirm,
    onCancel,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar',
    danger = false,
    width = 500,
    ...props
  }, ref) => {
    return (
      <AntModalComponent
        ref={ref}
        title={title}
        width={width}
        onOk={onConfirm}
        onCancel={onCancel}
        okText={confirmText}
        cancelText={cancelText}
        okButtonProps={{ danger, loading }}
        cancelButtonProps={{ disabled: loading }}
        {...props}
      >
        <Spin spinning={loading}>
          {children}
        </Spin>
      </AntModalComponent>
    );
  }
);

AntModal.displayName = 'AntModal';

export default AntModal;
