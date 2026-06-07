import React from 'react';
import { Modal as AntModalComponent, Spin } from 'antd';
import type { ModalProps } from 'antd';

interface AntModalOwnProps {
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

type AntModalProps = Omit<ModalProps, 'title'> & AntModalOwnProps;

export const AntModal: React.FC<AntModalProps> = ({
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
}) => {
  return (
    <AntModalComponent
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
};

export default AntModal;
