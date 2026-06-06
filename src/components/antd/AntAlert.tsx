import React from 'react';
import { Alert, Space, message, notification } from 'antd';
import type { AlertProps } from 'antd';

interface AntAlertProps extends Omit<AlertProps, 'type'> {
  type?: 'success' | 'info' | 'warning' | 'error';
  closeable?: boolean;
  title?: string;
  description?: string;
  onClose?: () => void;
}

export const AntAlert: React.FC<AntAlertProps> = ({
  type = 'info',
  closeable = true,
  title,
  description,
  onClose,
  ...props
}) => {
  return (
    <Alert
      type={type}
      message={title}
      description={description}
      closable={closeable}
      onClose={onClose}
      style={{ marginBottom: 16 }}
      {...props}
    />
  );
};

interface AlertsProps {
  alerts: Array<{
    type: 'success' | 'info' | 'warning' | 'error';
    title?: string;
    description?: string;
    key: string;
  }>;
  onClose?: (key: string) => void;
}

export const AntAlerts: React.FC<AlertsProps> = ({ alerts, onClose }) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      {alerts.map((alert) => (
        <AntAlert
          key={alert.key}
          type={alert.type}
          title={alert.title}
          description={alert.description}
          onClose={() => onClose?.(alert.key)}
        />
      ))}
    </Space>
  );
};

// Message helpers
export const messageManager = {
  success: (content: string, duration?: number) => {
    message.success(content, duration);
  },
  error: (content: string, duration?: number) => {
    message.error(content, duration);
  },
  info: (content: string, duration?: number) => {
    message.info(content, duration);
  },
  warning: (content: string, duration?: number) => {
    message.warning(content, duration);
  },
  loading: (content: string) => {
    return message.loading(content);
  },
};

// Notification helpers
export const notificationManager = {
  success: (config: { title: string; description?: string; duration?: number }) => {
    notification.success({
      message: config.title,
      description: config.description,
      duration: config.duration,
    });
  },
  error: (config: { title: string; description?: string; duration?: number }) => {
    notification.error({
      message: config.title,
      description: config.description,
      duration: config.duration,
    });
  },
  info: (config: { title: string; description?: string; duration?: number }) => {
    notification.info({
      message: config.title,
      description: config.description,
      duration: config.duration,
    });
  },
  warning: (config: { title: string; description?: string; duration?: number }) => {
    notification.warning({
      message: config.title,
      description: config.description,
      duration: config.duration,
    });
  },
};

// Hook para usar mensajes
export const useAntMessage = () => {
  return messageManager;
};

export const useAntNotification = () => {
  return notificationManager;
};

export default AntAlert;
