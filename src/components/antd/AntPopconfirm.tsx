import React from 'react';
import { Popconfirm, Button, Space } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface AntPopconfirmProps {
  title?: string;
  description?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  trigger?: 'click' | 'hover' | 'focus' | 'contextMenu';
  placement?: 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'left' | 'leftTop' | 'leftBottom' | 'right' | 'rightTop' | 'rightBottom';
}

export const AntPopconfirm: React.FC<AntPopconfirmProps> = ({
  title = '¿Estás seguro?',
  description,
  onConfirm,
  onCancel,
  okText = 'Sí',
  cancelText = 'No',
  danger = false,
  loading = false,
  children,
  trigger = 'click',
  placement = 'top',
}) => {
  return (
    <Popconfirm
      title={title}
      description={description}
      onConfirm={onConfirm}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ danger, loading }}
      trigger={trigger}
      placement={placement}
      icon={<ExclamationCircleOutlined style={{ color: danger ? '#ff4d4f' : '#faad14' }} />}
    >
      {children}
    </Popconfirm>
  );
};

interface DeleteButtonProps {
  onConfirm?: () => void | Promise<void>;
  title?: string;
  description?: string;
  loading?: boolean;
  danger?: boolean;
  tooltip?: string;
  size?: 'small' | 'middle' | 'large';
  text?: boolean;
}

export const AntDeleteButton: React.FC<DeleteButtonProps> = ({
  onConfirm,
  title = '¿Eliminar este elemento?',
  description = 'Esta acción no se puede deshacer',
  loading = false,
  danger = true,
  tooltip,
  size = 'middle',
  text = true,
}) => {
  return (
    <AntPopconfirm
      title={title}
      description={description}
      onConfirm={onConfirm}
      okText="Eliminar"
      cancelText="Cancelar"
      danger={danger}
      loading={loading}
    >
      <Button
        danger={danger}
        icon={<DeleteOutlined />}
        size={size}
        type={text ? 'text' : 'default'}
        title={tooltip}
      >
        {!text && 'Eliminar'}
      </Button>
    </AntPopconfirm>
  );
};

export default AntPopconfirm;
