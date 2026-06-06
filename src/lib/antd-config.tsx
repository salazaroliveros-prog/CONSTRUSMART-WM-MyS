import { ConfigProvider, theme } from 'antd';
import React from 'react';

export type ThemeMode = 'light' | 'dark';

interface AntdThemeConfig {
  mode: ThemeMode;
  primaryColor?: string;
}

// Paleta de colores CONSTRUSMART
const BRAND_COLORS = {
  primary: '#ff8c42', // Naranja
  success: '#52c41a', // Verde
  warning: '#faad14', // Amarillo
  error: '#f5222d', // Rojo
  info: '#1890ff', // Azul
  text: '#000000',
  textSecondary: '#666666',
  border: '#d9d9d9',
  bgBase: '#ffffff',
  bgSecondary: '#fafafa',
};

const DARK_COLORS = {
  primary: '#ff8c42', // Naranja (consistente)
  success: '#95de64', // Verde claro
  warning: '#ffc53d', // Amarillo claro
  error: '#ff7875', // Rojo claro
  info: '#69b1ff', // Azul claro
  text: '#ffffff',
  textSecondary: '#a6a6a6',
  border: '#434343',
  bgBase: '#141414',
  bgSecondary: '#1f1f1f',
};

export const getAntdTheme = (mode: ThemeMode = 'light') => {
  const colors = mode === 'light' ? BRAND_COLORS : DARK_COLORS;
  const baseTheme = mode === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm;

  return {
    algorithm: baseTheme,
    token: {
      // Colors
      colorPrimary: colors.primary,
      colorSuccess: colors.success,
      colorWarning: colors.warning,
      colorError: colors.error,
      colorInfo: colors.info,
      colorTextBase: colors.text,
      colorBorder: colors.border,
      colorBgBase: colors.bgBase,
      
      // Typography
      fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
      fontSize: 14,
      fontSizeHeading1: 38,
      fontSizeHeading2: 30,
      fontSizeHeading3: 24,
      fontSizeHeading4: 20,
      fontSizeHeading5: 16,
      lineHeight: 1.5715,
      lineHeightHeading1: 1.2,
      lineHeightHeading2: 1.35,
      
      // Spacing
      margin: 16,
      marginXS: 8,
      marginSM: 12,
      marginLG: 24,
      marginXL: 32,
      padding: 16,
      paddingXS: 8,
      paddingSM: 12,
      paddingLG: 24,
      paddingXL: 32,
      
      // Border
      borderRadius: 6,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      borderRadiusXS: 2,
      
      // Shadow
      boxShadow: mode === 'light'
        ? '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
        : '0 3px 6px -4px rgba(0, 0, 0, 0.45), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.15)',
      
      // Motion
      motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      motionEaseIn: 'cubic-bezier(0.55, 0.6, 0.675, 0.19)',
      motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      motionEaseInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
      motionEaseOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
      motionEaseInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
      motionEaseOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
      motionEaseInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
      motionEaseOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      motionUnit: 0.1,
    },
    components: {
      // Button
      Button: {
        primaryColor: colors.primary,
        controlHeight: 40,
        borderRadius: 6,
        fontWeight: 500,
        colorPrimaryHover: mode === 'light' ? '#ff9f54' : '#ffab5c',
        colorPrimaryActive: mode === 'light' ? '#e67e22' : '#ff7a45',
        controlOutlineWidth: 2,
        paddingContentHorizontal: 16,
      },
      
      // Input
      Input: {
        controlHeight: 36,
        borderRadius: 6,
        fontSize: 14,
        paddingBlock: 8,
        paddingInline: 12,
        colorBorder: colors.border,
        colorBgContainer: colors.bgBase,
        colorTextPlaceholder: mode === 'light' ? '#bfbfbf' : '#595959',
      },
      
      // Select
      Select: {
        controlHeight: 36,
        borderRadius: 6,
        fontSize: 14,
      },
      
      // Card
      Card: {
        colorBgContainer: colors.bgBase,
        boxShadow: mode === 'light'
          ? '0 1px 2px 0 rgba(0, 0, 0, 0.06), 0 1px 3px -1px rgba(0, 0, 0, 0.1)'
          : '0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px -1px rgba(0, 0, 0, 0.4)',
        borderRadiusLG: 8,
      },
      
      // Table
      Table: {
        colorBgContainer: colors.bgBase,
        colorBorder: colors.border,
        rowHoverBg: mode === 'light' ? 'rgba(255, 140, 66, 0.08)' : 'rgba(255, 140, 66, 0.15)',
        headerBg: mode === 'light' ? '#fafafa' : '#262626',
        headerColor: colors.text,
      },
      
      // Modal
      Modal: {
        colorBgElevated: colors.bgBase,
        colorBgMask: mode === 'light' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.85)',
        boxShadow: mode === 'light'
          ? '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
          : '0 3px 6px -4px rgba(0, 0, 0, 0.45), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.15)',
      },
      
      // Dropdown
      Dropdown: {
        colorBgElevated: colors.bgBase,
        colorBgElevatedHovered: mode === 'light' ? '#fafafa' : '#1f1f1f',
      },
      
      // Menu
      Menu: {
        colorBgContainer: colors.bgSecondary,
        colorItemBg: colors.bgSecondary,
        colorItemBgHover: mode === 'light' ? '#fff1e6' : '#262626',
        colorItemBgSelected: 'rgba(255, 140, 66, 0.1)',
        colorItemBgSelectedHorizontal: 'rgba(255, 140, 66, 0.1)',
        colorPrimaryItemBg: colors.bgSecondary,
      },
      
      // Notification
      Notification: {
        colorBgElevated: colors.bgBase,
        boxShadow: mode === 'light'
          ? '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
          : '0 3px 6px -4px rgba(0, 0, 0, 0.45), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.15)',
      },
      
      // Message
      Message: {
        colorBgElevated: colors.bgBase,
        boxShadow: mode === 'light'
          ? '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08)'
          : '0 3px 6px -4px rgba(0, 0, 0, 0.45), 0 6px 16px 0 rgba(0, 0, 0, 0.32)',
      },
      
      // Popover
      Popover: {
        colorBgElevated: colors.bgBase,
        boxShadow: mode === 'light'
          ? '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
          : '0 3px 6px -4px rgba(0, 0, 0, 0.45), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.15)',
      },
      
      // Tooltip
      Tooltip: {
        colorBgDefault: mode === 'light' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        colorTextLightSolid: mode === 'light' ? '#ffffff' : '#000000',
        borderRadiusLG: 4,
      },
      
      // Badge
      Badge: {
        colorError: colors.error,
        colorSuccess: colors.success,
        colorWarning: colors.warning,
        colorInfo: colors.info,
      },
      
      // Tag
      Tag: {
        colorBgContainer: mode === 'light' ? '#fafafa' : '#262626',
        colorBorder: colors.border,
      },
      
      // Form
      Form: {
        labelColor: colors.text,
        labelFontSize: 14,
        labelLineHeight: 1.5,
      },
      
      // Checkbox
      Checkbox: {
        controlHeight: 20,
        borderRadiusSM: 4,
        marginInlineEnd: 8,
      },
      
      // Radio
      Radio: {
        controlHeight: 20,
        borderRadiusSM: 50,
        marginInlineEnd: 8,
      },
      
      // Switch
      Switch: {
        controlHeight: 24,
        controlHeightSM: 20,
        borderRadius: 12,
      },
      
      // Slider
      Slider: {
        trackBg: colors.border,
        trackBgHover: mode === 'light' ? '#bfbfbf' : '#595959',
        colorPrimaryBorder: colors.primary,
      },
      
      // Progress
      Progress: {
        colorPrimaryBorder: colors.primary,
        trackBg: mode === 'light' ? '#f0f0f0' : '#262626',
      },
      
      // Pagination
      Pagination: {
        itemBg: colors.bgBase,
        itemLinkBg: colors.bgBase,
        itemActiveBgDisabled: 'rgba(255, 140, 66, 0.15)',
        itemActiveBorderColor: colors.primary,
        itemActiveColorDisabled: mode === 'light' ? '#bfbfbf' : '#595959',
      },
      
      // Skeleton
      Skeleton: {
        colorBgContainer: mode === 'light' ? '#f3f3f3' : '#2f2f2f',
      },
      
      // Empty
      Empty: {
        colorTextSecondary: colors.textSecondary,
      },
      
      // Spin
      Spin: {
        colorPrimaryBorder: colors.primary,
      },
      
      // Tabs
      Tabs: {
        colorBgContainer: colors.bgSecondary,
        colorBgContainerDisabled: mode === 'light' ? '#f5f5f5' : '#262626',
        colorBorderBg: colors.border,
      },
      
      // Collapse
      Collapse: {
        colorBgContainer: colors.bgBase,
        colorBorder: colors.border,
        colorBgHeader: colors.bgSecondary,
      },
      
      // Tree
      Tree: {
        colorBgContainer: colors.bgBase,
        colorBorder: colors.border,
      },
      
      // Select
      SelectContent: {
        colorBgElevated: colors.bgBase,
        boxShadow: mode === 'light'
          ? '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
          : '0 3px 6px -4px rgba(0, 0, 0, 0.45), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  };
};

interface AntdProviderProps {
  mode: ThemeMode;
  children: React.ReactNode;
}

export const AntdProvider: React.FC<AntdProviderProps> = ({ mode, children }) => {
  const themeConfig = getAntdTheme(mode);

  return (
    <ConfigProvider theme={themeConfig}>
      {children}
    </ConfigProvider>
  );
};

export default AntdProvider;
