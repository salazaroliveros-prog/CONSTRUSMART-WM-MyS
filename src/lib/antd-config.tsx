import React from 'react';

export type ThemeMode = 'light' | 'dark' | 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism' | 'high-contrast';

export const getAntdTheme = () => ({});

interface AntdProviderProps {
  mode: ThemeMode;
  children: React.ReactNode;
}

export const AntdProvider: React.FC<AntdProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export default AntdProvider;
