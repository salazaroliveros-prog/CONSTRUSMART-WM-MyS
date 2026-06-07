/**
 * Sistema de inicialización de temas para CONSTRUSMART ERP
 * Cargado sincrónicamente desde main.tsx antes de que React renderice
 */

export type ThemeName = 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism';

export interface ThemeInfo {
  label: string;
  description: string;
  colors: {
    primary: string;
    background: string;
    foreground: string;
  };
}

export const THEMES: Record<ThemeName, ThemeInfo> = {
  'ant-design': {
    label: 'Ant Design',
    description: 'Estilo clásico profesional',
    colors: { primary: '#1677ff', background: '#ffffff', foreground: '#1a1a2e' },
  },
  'dark-pro': {
    label: 'Dark Pro',
    description: 'Modo oscuro premium',
    colors: { primary: '#00d9ff', background: '#0d1b2a', foreground: '#e0e0e0' },
  },
  'material3': {
    label: 'Material 3',
    description: 'Diseño moderno Material',
    colors: { primary: '#6750a4', background: '#fffbff', foreground: '#1c1b1f' },
  },
  'glassmorphism': {
    label: 'Glassmorphism',
    description: 'Efecto vidrio moderno',
    colors: { primary: '#00b4d8', background: '#f0f8ff', foreground: '#1a1a2e' },
  },
  'neomorphism': {
    label: 'Neomorphism',
    description: 'Estilo suave y elevado',
    colors: { primary: '#6c757d', background: '#e4ebf5', foreground: '#333333' },
  },
};

export const PRIMARY_COLORS = [
  { label: 'Azul Default', value: '#1677ff' },
  { label: 'Naranja Construcción', value: '#ff8c42' },
  { label: 'Verde Éxito', value: '#52c41a' },
  { label: 'Rojo Destructivo', value: '#f5222d' },
  { label: 'Púrpura Material', value: '#6750a4' },
  { label: 'Cian Oscuro', value: '#00d9ff' },
  { label: 'Amarillo Warning', value: '#faad14' },
  { label: 'Azul Info', value: '#1890ff' },
];

export type UIMode = 'shadcn' | 'antd';

export interface ThemeConfig {
  appTheme: string;
  compactMode: boolean;
  primaryColor?: string;
  uiMode?: UIMode;
}

/**
 * Inicializa el tema en el documento basado en localStorage
 */
export function initializeTheme(): void {
  try {
    const savedTheme = localStorage.getItem('wm_erp_theme') || 'ant-design';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const isDark = savedTheme === 'dark-pro';
    document.documentElement.classList.toggle('dark', isDark);

    const saved = localStorage.getItem('wm_erp_data_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.compactMode) {
        document.documentElement.classList.add('compact');
      }
      if (parsed?.primaryColor) {
        document.documentElement.style.setProperty('--primary-hue', parsed.primaryColor);
      }
    }
  } catch {
    // Silencio — fallback seguro
  }
}

/**
 * Aplica configuración de tema al documento en caliente
 */
export function applyThemeToDocument(config: Partial<ThemeConfig>): void {
  if (!config) return;

  const theme = config.appTheme || localStorage.getItem('wm_erp_theme') || 'ant-design';
  document.documentElement.setAttribute('data-theme', theme);

  const isDark = theme === 'dark-pro';
  document.documentElement.classList.toggle('dark', isDark);

  if (config.compactMode !== undefined) {
    document.documentElement.classList.toggle('compact', config.compactMode);
  }

  if (config.primaryColor) {
    document.documentElement.style.setProperty('--primary-hue', config.primaryColor);
  }
}