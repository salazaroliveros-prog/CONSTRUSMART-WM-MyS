import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme as antdTheme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark' | 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism' | 'high-contrast' | 'nova-os';

const glassTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0891b2',
    colorInfo: '#0284c7',
    colorSuccess: '#059669',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorText: '#102a43',
    colorTextSecondary: '#486581',
    colorBgBase: '#eaf6fb',
    colorBgContainer: 'rgba(255, 255, 255, 0.68)',
    colorBgElevated: 'rgba(255, 255, 255, 0.88)',
    colorBorder: 'rgba(148, 187, 207, 0.52)',
    borderRadius: 8,
    controlHeight: 38,
    fontFamily: 'Inter, system-ui, sans-serif',
    boxShadow: '0 12px 36px rgba(26, 68, 93, 0.12)',
    boxShadowSecondary: '0 20px 60px rgba(26, 68, 93, 0.18)',
  },
  components: {
    Card: { colorBgContainer: 'rgba(255, 255, 255, 0.58)' },
    Table: { headerBg: 'rgba(224, 242, 247, 0.72)', rowHoverBg: 'rgba(207, 250, 254, 0.42)' },
    Modal: { contentBg: 'rgba(255, 255, 255, 0.9)', headerBg: 'transparent' },
    Layout: { bodyBg: 'transparent', siderBg: 'rgba(255, 255, 255, 0.56)', headerBg: 'rgba(255, 255, 255, 0.58)' },
  },
};

export const getAntdTheme = (mode: ThemeMode = 'glassmorphism'): ThemeConfig => {
  if (mode === 'dark-pro' || mode === 'dark') return { algorithm: antdTheme.darkAlgorithm };
  if (mode === 'glassmorphism') return glassTheme;
  if (mode === 'nova-os') return {
    algorithm: antdTheme.darkAlgorithm,
    token: {
      colorPrimary: '#ffffff',
      colorBgBase: '#1c1c1e',
      colorTextBase: '#ffffff',
      borderRadius: 18,
      borderRadiusLG: 20,
      borderRadiusSM: 12,
    },
  };
  return {};
};

interface AntdProviderProps {
  mode: ThemeMode;
  children: React.ReactNode;
}

export const AntdProvider: React.FC<AntdProviderProps> = ({ mode, children }) => {
  const [activeMode, setActiveMode] = useState<ThemeMode>(mode);

  useEffect(() => {
    const readTheme = () => {
      const themeName = document.documentElement.getAttribute('data-theme') as ThemeMode | null;
      setActiveMode(themeName ?? mode);
    };
    readTheme();
    window.addEventListener('wm-theme-changed', readTheme);
    return () => window.removeEventListener('wm-theme-changed', readTheme);
  }, [mode]);

  return <ConfigProvider theme={getAntdTheme(activeMode)}>{children}</ConfigProvider>;
};

export default AntdProvider;
