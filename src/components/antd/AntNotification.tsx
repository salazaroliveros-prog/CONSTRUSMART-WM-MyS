import React from 'react';
import { notification } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'loading';

export interface NotificationConfig {
  title: string;
  description?: string;
  duration?: number;
  top?: number;
}

const getIcon = (type: NotificationType) => {
  const iconProps = { style: { fontSize: '24px' } };
  switch (type) {
    case 'success':
      return <CheckCircleOutlined {...iconProps} style={{ color: '#52c41a', ...iconProps.style }} />;
    case 'error':
      return <CloseCircleOutlined {...iconProps} style={{ color: '#f5222d', ...iconProps.style }} />;
    case 'warning':
      return <ExclamationCircleOutlined {...iconProps} style={{ color: '#faad14', ...iconProps.style }} />;
    case 'info':
      return <InfoCircleOutlined {...iconProps} style={{ color: '#1890ff', ...iconProps.style }} />;
    case 'loading':
      return <LoadingOutlined {...iconProps} style={{ color: '#ff8c42', ...iconProps.style }} />;
    default:
      return null;
  }
};

class AntNotificationManager {
  private notificationInstance: any = null;

  show(type: NotificationType, config: NotificationConfig) {
    notification[type]({
      icon: getIcon(type),
      message: config.title,
      description: config.description || '',
      duration: config.duration ?? 4.5,
      top: config.top ?? 24,
      placement: 'topRight',
    });
  }

  success(config: NotificationConfig) {
    this.show('success', config);
  }

  error(config: NotificationConfig) {
    this.show('error', config);
  }

  warning(config: NotificationConfig) {
    this.show('warning', config);
  }

  info(config: NotificationConfig) {
    this.show('info', config);
  }

  loading(config: NotificationConfig) {
    this.show('loading', { ...config, duration: 0 });
  }

  closeAll() {
    notification.destroy();
  }
}

export const notificationManager = new AntNotificationManager();

// Hook para usar en componentes
export const useAntNotification = () => {
  return notificationManager;
};

export default AntNotificationManager;
