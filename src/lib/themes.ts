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
    card?: string;
    cardForeground?: string;
    muted?: string;
    mutedForeground?: string;
    border?: string;
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
 * Convierte un color HEX a HSL string (ej: '#ff8c42' → '24 96% 63%')
 */
function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!result) return '24 96% 63%';
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
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
        const hsl = hexToHSL(parsed.primaryColor);
        document.documentElement.style.setProperty('--primary-hue', hsl);
        document.documentElement.style.setProperty('--primary', hsl);
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
    const hsl = hexToHSL(config.primaryColor);
    document.documentElement.style.setProperty('--primary-hue', hsl);
    document.documentElement.style.setProperty('--primary', hsl);
  }
}

/**
 * Sincroniza el estado de animaciones con el DOM
 * Añade/remueve la clase .animations-disabled en <html>
 */
export function syncAnimationsSetting(enabled: boolean): void {
  document.documentElement.classList.toggle('animations-disabled', !enabled);
}

/**
 * Sincroniza TODAS las preferencias visuales desde AppSettings al DOM en un solo llamado.
 * Usado por AppLayout para mantener el DOM siempre consistente con la configuración.
 */
export function syncAllVisualSettings(settings: {
  appTheme?: string;
  compactMode?: boolean;
  primaryColor?: string;
  uiMode?: string;
  animationsEnabled?: boolean;
  fontSize?: string;
  fontFamily?: string;
  borderRadius?: string;
  spacingScale?: string;
  densityTable?: string;
  sidebarPosition?: string;
  sidebarMode?: string;
  sidebarWidth?: number;
  breadcrumbsEnabled?: boolean;
  footerEnabled?: boolean;
  touchMode?: boolean;
}): void {
  if (settings.appTheme) {
    document.documentElement.setAttribute('data-theme', settings.appTheme);
    document.documentElement.classList.toggle('dark', settings.appTheme === 'dark-pro');
  }
  if (settings.compactMode !== undefined) {
    document.documentElement.classList.toggle('compact', settings.compactMode);
  }
  if (settings.primaryColor) {
    const hsl = hexToHSL(settings.primaryColor);
    document.documentElement.style.setProperty('--primary-hue', hsl);
    document.documentElement.style.setProperty('--primary', hsl);
  }
  if (settings.animationsEnabled !== undefined) {
    syncAnimationsSetting(settings.animationsEnabled);
  }
  if (settings.fontSize) {
    document.documentElement.setAttribute('data-font-size', settings.fontSize);
  }
  if (settings.fontFamily) {
    document.documentElement.setAttribute('data-font-family', settings.fontFamily);
  }
  if (settings.borderRadius) {
    document.documentElement.setAttribute('data-border-radius', settings.borderRadius);
  }
  if (settings.spacingScale) {
    document.documentElement.setAttribute('data-spacing-scale', settings.spacingScale);
  }
  if (settings.densityTable) {
    document.documentElement.setAttribute('data-density-table', settings.densityTable);
  }
  if (settings.sidebarPosition) {
    document.documentElement.setAttribute('data-sidebar-position', settings.sidebarPosition);
  }
  if (settings.sidebarMode) {
    document.documentElement.setAttribute('data-sidebar-mode', settings.sidebarMode);
  }
  if (settings.sidebarWidth) {
    document.documentElement.setAttribute('data-sidebar-width', String(settings.sidebarWidth));
  }
  if (settings.breadcrumbsEnabled !== undefined) {
    document.documentElement.setAttribute('data-breadcrumbs-enabled', String(settings.breadcrumbsEnabled));
  }
  if (settings.footerEnabled !== undefined) {
    document.documentElement.setAttribute('data-footer-enabled', String(settings.footerEnabled));
  }
  if (settings.touchMode !== undefined) {
    document.documentElement.setAttribute('data-touch-mode', String(settings.touchMode));
  }
}