/**
 * CONSTRUSMART ERP — Theme Manager
 * Fuente única para sincronización de ajustes visuales con el DOM.
 */

export const CLASS_PREFIX = 'wm-erp-';
export const VALID_THEMES = ['ant-design', 'dark-pro', 'material3', 'glassmorphism', 'neomorphism', 'nova-os'] as const;
export type ThemeName = typeof VALID_THEMES[number];

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
  'nova-os': {
    label: 'Nova OS',
    description: 'Dark system premium · Instrument Serif',
    colors: { primary: '#ffffff', background: '#1c1c1e', foreground: '#ffffff', card: '#2c2c2e', cardForeground: '#ffffff', muted: '#3a3a3c', mutedForeground: '#a1a1aa', border: '#38383a' },
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
  { label: 'Nova Blanco', value: '#FFFFFF' },
];

export type ThemeConfig = {
  appTheme: string;
  compactMode: boolean;
  primaryColor?: string;
  uiMode?: 'shadcn' | 'antd';
};

export interface VisualSettings {
  compactMode?: boolean;
  densityTable?: string;
  sidebarPosition?: 'left' | 'right' | 'overlay';
  touchMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  fontFamily?: string;
  borderRadius?: string;
  spacingScale?: string;
  animationsEnabled?: boolean;
  breadcrumbsEnabled?: boolean;
  footerEnabled?: boolean;
  sidebarMode?: string;
  sidebarWidth?: number;
  sidebarMiniWidth?: number;
  appTheme?: string;
  primaryColor?: string;
  uiMode?: string;
}

export function isValidTheme(theme: unknown): theme is ThemeName {
  return VALID_THEMES.includes(theme as ThemeName);
}

export function hexToHSL(hex: string): string {
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

function applyThemeAttribute(theme: string): void {
  if (!VALID_THEMES.includes(theme as ThemeName)) return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark-pro' || theme === 'nova-os');
}

function resetBodyClasses(body: HTMLElement): void {
  body.classList.remove(
    `${CLASS_PREFIX}compact`, `${CLASS_PREFIX}touch`, `${CLASS_PREFIX}anim-disabled`,
    `${CLASS_PREFIX}breadcrumbs-hidden`, `${CLASS_PREFIX}footer-hidden`,
    'vs-compact', 'vs-touch', 'vs-anim-disabled', 'vs-breadcrumbs-hidden', 'vs-footer-hidden',
    'density-compact', 'density-normal', 'density-comfortable',
    'sidebar-left', 'sidebar-right', 'sidebar-overlay', 'touch-mode', 'compact'
  );
}

function resetHtmlAttributes(html: HTMLElement): void {
  html.classList.remove('compact', 'dark');
  html.removeAttribute('data-theme');
  html.removeAttribute('data-font-size');
  html.removeAttribute('data-sidebar-mode');
  html.removeAttribute('data-breadcrumbs-enabled');
  html.removeAttribute('data-footer-enabled');
  html.style.cssText = '';
}

export function syncAllVisualSettings(settings: VisualSettings): void {
  if (typeof document === 'undefined') return;
  if (!settings) return;
  const body = document.body;
  const html = document.documentElement;

  resetBodyClasses(body);
  resetHtmlAttributes(html);

  const theme = settings.appTheme && VALID_THEMES.includes(settings.appTheme as ThemeName) ? settings.appTheme : 'glassmorphism';
  applyThemeAttribute(theme);

  if (settings.compactMode !== undefined) {
    html.classList.toggle('compact', settings.compactMode);
  }

  if (settings.primaryColor) {
    try {
      const hsl = hexToHSL(settings.primaryColor);
      html.style.setProperty('--primary', hsl);
    } catch {
      html.style.removeProperty('--primary');
    }
  }

  if (settings.animationsEnabled !== undefined) {
    html.classList.toggle('animations-disabled', !settings.animationsEnabled);
  }

  if (settings.fontSize) {
    html.setAttribute('data-font-size', settings.fontSize);
  }

  if (settings.spacingScale) {
    const spacingMap: Record<string, string> = { compact: '4px', normal: '8px', spacious: '16px' };
    html.style.setProperty('--spacing-selected', spacingMap[settings.spacingScale] || '8px');
  }

  if (settings.densityTable) {
    body.classList.add(`density-${settings.densityTable}`);
  }

  if (settings.sidebarPosition) {
    body.classList.add(`sidebar-${settings.sidebarPosition}`);
    html.style.setProperty('--sidebar-position', settings.sidebarPosition);
  }

  if (settings.sidebarMode) {
    html.setAttribute('data-sidebar-mode', settings.sidebarMode);
  }

  if (settings.sidebarWidth) {
    html.style.setProperty('--sidebar-width', `${Math.max(180, Math.min(320, settings.sidebarWidth))}px`);
  }

  if (settings.sidebarMiniWidth) {
    html.style.setProperty('--sidebar-mini-width', `${Math.max(60, Math.min(85, settings.sidebarMiniWidth))}px`);
  }

  if (settings.breadcrumbsEnabled !== undefined) {
    html.setAttribute('data-breadcrumbs-enabled', String(settings.breadcrumbsEnabled));
  }

  if (settings.footerEnabled !== undefined) {
    html.setAttribute('data-footer-enabled', String(settings.footerEnabled));
  }

  if (settings.touchMode !== undefined) {
    body.classList.toggle('touch-mode', settings.touchMode);
  }

  if (settings.animationsEnabled === false) {
    body.style.setProperty('--motion-duration-normal', '0ms');
    body.style.setProperty('--motion-duration-fast', '0ms');
  } else {
    body.style.removeProperty('--motion-duration-normal');
    body.style.removeProperty('--motion-duration-fast');
  }
}

export function initializeTheme(): void {
  try {
    const savedTheme = localStorage.getItem('wm_erp_theme') || 'glassmorphism';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const isDark = savedTheme === 'dark-pro' || savedTheme === 'nova-os';
    document.documentElement.classList.toggle('dark', isDark);

    const saved = localStorage.getItem('wm_erp_data_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if ((parsed as any).compactMode) {
          document.documentElement.classList.add('compact');
        }
        if ((parsed as any).primaryColor) {
          const hsl = hexToHSL((parsed as any).primaryColor);
          document.documentElement.style.setProperty('--primary', hsl);
        }
      }
    }
  } catch {
    // Silencio — fallback seguro
  }
}

export function applyThemeToDocument(config: Partial<ThemeConfig>): void {
  if (!config) return;

  const theme = config.appTheme || localStorage.getItem('wm_erp_theme') || 'glassmorphism';
  document.documentElement.setAttribute('data-theme', theme);

  const isDark = theme === 'dark-pro' || theme === 'nova-os';
  document.documentElement.classList.toggle('dark', isDark);

  if (config.compactMode !== undefined) {
    document.documentElement.classList.toggle('compact', config.compactMode);
  }

  if (config.primaryColor) {
    const hsl = hexToHSL(config.primaryColor);
    document.documentElement.style.setProperty('--primary', hsl);
  }
}

export function syncAnimationsSetting(enabled: boolean): void {
  document.documentElement.classList.toggle('animations-disabled', !enabled);
}
