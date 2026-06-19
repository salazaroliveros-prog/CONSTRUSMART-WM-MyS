import React, { useState } from 'react';
import { Button, Spin, message, notification } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

export interface ToastOptions {
  type?: 'success' | 'error' | 'info' | 'warning' | 'loading';
  duration?: number;
  key?: string;
  onClose?: () => void;
}

export interface ButtonLoadingState {
  loading?: boolean;
  text?: string;
  loadingText?: string;
}

export const toast = {
  success: (content: string, options?: ToastOptions) => {
    notification.success({
      message: 'Éxito',
      description: content,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      ...options,
    });
  },

  error: (content: string, options?: ToastOptions) => {
    notification.error({
      message: 'Error',
      description: content,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      ...options,
    });
  },

  info: (content: string, options?: ToastOptions) => {
    notification.info({
      message: 'Información',
      description: content,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      ...options,
    });
  },

  warning: (content: string, options?: ToastOptions) => {
    notification.warning({
      message: 'Advertencia',
      description: content,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      ...options,
    });
  },

  loading: (content: string, key?: string) => {
    const toastKey = key || `loading-${Date.now()}`;
    notification.open({
      key: toastKey,
      message: 'Procesando...',
      description: content,
      icon: <LoadingOutlined style={{ color: '#1890ff' }} />,
      duration: 0,
    });
    return toastKey;
  },

  close: (key: string) => {
    notification.close(key);
  },
};

export const LoadingButton: React.FC<{
  children: React.ReactNode;
  onClick: () => Promise<void> | void;
  loadingText?: string;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  size?: 'large' | 'middle' | 'small';
  disabled?: boolean;
  block?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: () => void;
}> = ({ 
  children, 
  onClick, 
  loadingText = 'Procesando...', 
  type = 'primary',
  size = 'middle',
  disabled = false,
  block = false,
  className = '',
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      await onClick();
      setLoading(false);
      onSuccess?.();
    } catch (error) {
      setLoading(false);
      toast.error('Error al procesar la operación');
      onError?.();
    }
  };

  return (
    <Button
      type={type}
      size={size}
      disabled={disabled || loading}
      loading={loading}
      onClick={handleClick}
      block={block}
      className={className}
      icon={loading && <LoadingOutlined />}
    >
      {loading ? loadingText : children}
    </Button>
  );
};

export const withLoading = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingText = 'Cargando...'
) => {
  return (props: P & ButtonLoadingState) => {
    const { loading = false, text, loadingText: customLoadingText, ...rest } = props;
    
    return (
      <LoadingButton
        onClick={async () => {}}
        loadingText={customLoadingText || loadingText}
        {...(rest as any)}
      >
        {text || <WrappedComponent {...(props as any)} />}
      </LoadingButton>
    );
  };
};

export interface ProgressToastProps {
  key: string;
  title: string;
  total: number;
  current: number;
  status?: 'active' | 'success' | 'exception';
  message?: string;
}

export const ProgressToast: React.FC<ProgressToastProps> = ({
  key,
  title,
  total,
  current,
  status = 'active',
  message,
}) => {
  const progress = Math.round((current / total) * 100);

  const statusIcon = {
    active: <LoadingOutlined style={{ color: '#1890ff' }} />,
    success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    exception: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  };

  notification.open({
    key,
    message: title,
    description: (
      <div>
        <div style={{ marginBottom: 8 }}>
          <Spin indicator={statusIcon[status]} size="small" />
          <span style={{ marginLeft: 8 }}>
            {status === 'active' ? `Procesando... (${current}/${total})` 
             : status === 'success' ? 'Completado' 
             : 'Error'}
          </span>
        </div>
        <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
          <div 
            style={{
              height: '100%',
              background: status === 'exception' ? '#ff4d4f' : '#1890ff',
              width: `${progress}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        {message && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            {message}
          </div>
        )}
      </div>
    ),
    duration: status === 'active' ? 0 : 4,
    closeIcon: status !== 'active',
  });
};

export const updateProgressToast = (key: string, current: number, message?: string) => {
  notification.config({
    key,
    description: (
      <div>
        <div style={{ marginBottom: 8 }}>
          <LoadingOutlined style={{ color: '#1890ff' }} />
          <span style={{ marginLeft: 8 }}>Procesando... ({current})</span>
        </div>
        {message && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            {message}
          </div>
        )}
      </div>
    ),
  });
};
