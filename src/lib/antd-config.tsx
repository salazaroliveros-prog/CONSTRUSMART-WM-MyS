import { ConfigProvider, theme } from 'antd';
import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

const { defaultAlgorithm, darkAlgorithm } = theme;
dayjs.locale('es');

export type ThemeMode = 'light' | 'dark' | 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism' | 'high-contrast';

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
  const isDark = mode === 'dark' || mode === 'dark-pro';
  const baseTheme = isDark ? darkAlgorithm : defaultAlgorithm;

  const themeColors: Record<ThemeMode, {
    primary: string; success: string; warning: string; error: string; info: string;
    text: string; textSecondary: string; border: string; bgBase: string; bgSecondary: string;
    borderRadius: number; borderRadiusLG: number;
    shadow: string; shadowColor: string;
  }> = {
    'light': {
      primary: '#1677ff', success: '#52c41a', warning: '#faad14', error: '#f5222d', info: '#1890ff',
      text: '#000000', textSecondary: '#666666', border: '#d9d9d9', bgBase: '#ffffff', bgSecondary: '#fafafa',
      borderRadius: 6, borderRadiusLG: 8, shadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', shadowColor: '0, 0, 0',
    },
    'dark': {
      primary: '#ff8c42', success: '#95de64', warning: '#ffc53d', error: '#ff7875', info: '#69b1ff',
      text: '#ffffff', textSecondary: '#a6a6a6', border: '#434343', bgBase: '#141414', bgSecondary: '#1f1f1f',
      borderRadius: 6, borderRadiusLG: 8, shadow: '0 3px 6px -4px rgba(0, 0, 0, 0.45), 0 6px 16px 0 rgba(0, 0, 0, 0.32), 0 9px 28px 8px rgba(0, 0, 0, 0.15)', shadowColor: '0, 0, 0',
    },
    'ant-design': {
      primary: '#1677ff', success: '#52c41a', warning: '#faad14', error: '#f5222d', info: '#1890ff',
      text: '#000000', textSecondary: '#666666', border: '#d9d9d9', bgBase: '#ffffff', bgSecondary: '#fafafa',
      borderRadius: 6, borderRadiusLG: 8, shadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', shadowColor: '0, 0, 0',
    },
    'dark-pro': {
      primary: '#00d9ff', success: '#95de64', warning: '#ffc53d', error: '#ff7875', info: '#69b1ff',
      text: '#e0e0e0', textSecondary: '#a0a0a0', border: '#2a3a4a', bgBase: '#0d1b2a', bgSecondary: '#1b2838',
      borderRadius: 8, borderRadiusLG: 12, shadow: '0 6px 16px -8px rgba(0, 217, 255, 0.15), 0 9px 28px 0 rgba(0, 217, 255, 0.1), 0 12px 48px 16px rgba(0, 217, 255, 0.05)', shadowColor: '0, 217, 255',
    },
    'material3': {
      primary: '#6750a4', success: '#4caf50', warning: '#ff9800', error: '#f44336', info: '#2196f3',
      text: '#1c1b1f', textSecondary: '#49454f', border: '#cac4d0', bgBase: '#fffbff', bgSecondary: '#f3edf7',
      borderRadius: 12, borderRadiusLG: 16, shadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)', shadowColor: '0, 0, 0',
    },
    'glassmorphism': {
      primary: '#00b4d8', success: '#52c41a', warning: '#faad14', error: '#f5222d', info: '#1890ff',
      text: '#1a1a2e', textSecondary: '#4a4a6a', border: 'rgba(0, 0, 0, 0.08)', bgBase: '#f0f8ff', bgSecondary: '#e6f2ff',
      borderRadius: 12, borderRadiusLG: 16, shadow: '0 8px 32px rgba(31, 38, 135, 0.15)', shadowColor: '31, 38, 135',
    },
    'neomorphism': {
      primary: '#6c757d', success: '#52c41a', warning: '#faad14', error: '#f5222d', info: '#1890ff',
      text: '#333333', textSecondary: '#666666', border: 'transparent', bgBase: '#e4ebf5', bgSecondary: '#d8dfe9',
      borderRadius: 12, borderRadiusLG: 16, shadow: '6px 6px 12px #c8d0da, -6px -6px 12px #ffffff', shadowColor: '0, 0, 0',
    },
    'high-contrast': {
      primary: '#0000ff', success: '#008000', warning: '#8b6914', error: '#cc0000', info: '#0000ff',
      text: '#000000', textSecondary: '#333333', border: '#000000', bgBase: '#ffffff', bgSecondary: '#f0f0f0',
      borderRadius: 4, borderRadiusLG: 6, shadow: 'none', shadowColor: '0, 0, 0',
    },
  };

  const colors = themeColors[mode] || themeColors['ant-design'];
  const algorithm = baseTheme;

  return {
    algorithm,
    token: {
      colorPrimary: colors.primary,
      colorSuccess: colors.success,
      colorWarning: colors.warning,
      colorError: colors.error,
      colorInfo: colors.info,
      colorTextBase: colors.text,
      colorTextSecondary: colors.textSecondary,
      colorBorder: colors.border,
      colorBgBase: colors.bgBase,
      colorBgContainer: colors.bgBase,
      colorBgLayout: colors.bgSecondary,
      colorFillSecondary: colors.bgSecondary,
      borderRadius: colors.borderRadius,
      borderRadiusLG: colors.borderRadiusLG,
      boxShadow: colors.shadow,
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
      Button: {
        controlHeight: 40,
        borderRadius: colors.borderRadius,
        borderRadiusLG: colors.borderRadiusLG,
        fontWeight: 500,
        controlOutlineWidth: 2,
        paddingContentHorizontal: 16,
      },
      Input: {
        controlHeight: 36,
        borderRadius: colors.borderRadius,
        borderRadiusLG: colors.borderRadiusLG,
        fontSize: 14,
        paddingBlock: 8,
        paddingInline: 12,
        colorBorder: colors.border,
        colorBgContainer: colors.bgBase,
        colorTextPlaceholder: isDark ? '#595959' : '#bfbfbf',
      },
      Select: {
        controlHeight: 36,
        borderRadius: colors.borderRadius,
        borderRadiusLG: colors.borderRadiusLG,
        fontSize: 14,
      },
      Card: {
        colorBgContainer: colors.bgBase,
        colorBgElevated: colors.bgSecondary,
        boxShadow: colors.shadow,
        borderRadiusLG: colors.borderRadiusLG,
      },
      Table: {
        colorBgContainer: colors.bgBase,
        colorBorder: colors.border,
        headerBg: colors.bgSecondary,
        headerColor: colors.text,
        rowHoverBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.02)',
      },
      Modal: {
        colorBgElevated: colors.bgBase,
        colorBgMask: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.45)',
        boxShadow: `0 6px 16px -8px rgba(${colors.shadowColor} / 0.15), 0 9px 28px 0 rgba(${colors.shadowColor} / 0.1), 0 12px 48px 16px rgba(${colors.shadowColor} / 0.05)`,
      },
      Dropdown: {
        colorBgElevated: colors.bgBase,
        colorBgElevatedHovered: colors.bgSecondary,
      },
      Menu: {
        colorBgContainer: colors.bgSecondary,
        colorItemBg: colors.bgSecondary,
        colorItemBgHover: isDark ? 'rgba(255, 255, 255, 0.08)' : '#fff1e6',
        colorItemBgSelected: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 140, 66, 0.1)',
        colorItemBgSelectedHorizontal: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 140, 66, 0.1)',
        colorPrimaryItemBg: colors.bgSecondary,
      },
      Notification: {
        colorBgElevated: colors.bgBase,
        boxShadow: colors.shadow,
      },
      Message: {
        colorBgElevated: colors.bgBase,
        boxShadow: colors.shadow,
      },
      Popover: {
        colorBgElevated: colors.bgBase,
        boxShadow: colors.shadow,
      },
      Tooltip: {
        colorBgDefault: isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
        colorTextLightSolid: isDark ? '#000000' : '#ffffff',
        borderRadiusLG: 4,
      },
      Badge: {
        colorError: colors.error,
        colorSuccess: colors.success,
        colorWarning: colors.warning,
        colorInfo: colors.info,
      },
      Tag: {
        colorBgContainer: colors.bgSecondary,
        colorBorder: colors.border,
      },
      Form: {
        labelColor: colors.text,
        labelFontSize: 14,
        labelLineHeight: 1.5,
      },
      Checkbox: {
        controlHeight: 20,
        borderRadiusSM: 4,
        marginInlineEnd: 8,
      },
      Radio: {
        controlHeight: 20,
        borderRadiusSM: 50,
        marginInlineEnd: 8,
      },
      Switch: {
        controlHeight: 24,
        controlHeightSM: 20,
        borderRadius: 12,
      },
      Slider: {
        trackBg: colors.border,
        trackBgHover: isDark ? '#595959' : '#bfbfbf',
        colorPrimaryBorder: colors.primary,
      },
      Progress: {
        colorPrimaryBorder: colors.primary,
        trackBg: isDark ? '#262626' : '#f0f0f0',
      },
      Pagination: {
        itemBg: colors.bgBase,
        itemLinkBg: colors.bgBase,
        itemActiveBgDisabled: 'rgba(255, 140, 66, 0.15)',
        itemActiveBorderColor: colors.primary,
        itemActiveColorDisabled: isDark ? '#595959' : '#bfbfbf',
      },
      Skeleton: {
        colorBgContainer: isDark ? '#2f2f2f' : '#f3f3f3',
      },
      Empty: {
        colorTextSecondary: colors.textSecondary,
      },
      Spin: {
        colorPrimaryBorder: colors.primary,
      },
      Tabs: {
        colorBgContainer: colors.bgSecondary,
        colorBgContainerDisabled: isDark ? '#262626' : '#f5f5f5',
        colorBorderBg: colors.border,
      },
      Collapse: {
        colorBgContainer: colors.bgBase,
        colorBorder: colors.border,
        colorBgHeader: colors.bgSecondary,
      },
      Tree: {
        colorBgContainer: colors.bgBase,
        colorBorder: colors.border,
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
