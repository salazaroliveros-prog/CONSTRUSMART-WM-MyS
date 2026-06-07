/**
 * 🎨 Generador de tema dinámico para CONSTRUSMART ERP
 * Basado en: TECHNICAL_IMPLEMENTATION_GUIDE.md - Theme engine refactor
 */

interface ThemeSettings {
  primaryColor?: string;
  appTheme?: string;
  compactMode?: boolean;
  uiMode?: 'shadcn' | 'antd';
}

/**
 * Ajusta un color HSL para dark mode
 * @param hslColor - Color en formato HSL (e.g., "18 80% 52%")
 * @returns Color HSL ajustado para dark mode
 */
export function adjustForDarkMode(hslColor: string): string {
  const parts = hslColor.trim().split(/\s+/);
  if (parts.length < 3) return hslColor;
  
  const hue = parts[0];
  const saturation = parts[1];
  const lightness = parts[2];
  
  // Para dark mode, aumentar lightness y mantener hue
  const lightNum = parseInt(lightness);
  const adjustedLight = Math.min(lightNum + 8, 80);
  
  return `${hue} ${saturation} ${adjustedLight}%`;
}

/**
 * Genera las variables CSS del tema basado en settings
 */
export function generateThemeCSSVariables(settings: ThemeSettings): Record<string, string> {
  const isDark = settings.appTheme === 'dark';
  const baseHsl = settings.primaryColor || '222.2 47.4% 11.2%';

  return {
    '--primary': isDark ? adjustForDarkMode(baseHsl) : baseHsl,
    '--radius': settings.compactMode ? '0.5rem' : '0.75rem',
  };
}

/**
 * Genera el objeto de configuración de tema de Ant Design
 */
export function generateAntdThemeToken(settings: ThemeSettings) {
  const isDark = settings.appTheme === 'dark';
  const isCompact = settings.compactMode === true;
  const isModerno = settings.uiMode === 'antd';

  return {
    algorithm: isDark ? 'dark' : isCompact ? 'compact' : 'default',
    token: {
      colorPrimary: settings.primaryColor || getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#E8752F',
      borderRadius: isModerno ? 8 : 12,
      controlHeight: isCompact ? 32 : isModerno ? 36 : 40,
    },
  };
}

// Mapa de appTheme → data-theme para los 5 temas de themes.css
const THEME_MAP: Record<string, string> = {
  'ant-design': 'ant-design',
  'dark-pro': 'dark-pro',
  'material3': 'material3',
  'glassmorphism': 'glassmorphism',
  'neomorphism': 'neomorphism',
  // appTheme light/dark → ant-design por defecto
  'light': 'ant-design',
  'dark': 'dark-pro',
  'high-contrast': 'material3',
};

/**
 * Aplica variables CSS al :root del documento
 */
export function applyThemeToDocument(settings: ThemeSettings): void {
  const root = document.documentElement;
  
  // Aplicar data-theme para activar el CSS correcto en themes.css
  const dataTheme = THEME_MAP[settings.appTheme || 'light'] || 'ant-design';
  root.setAttribute('data-theme', dataTheme);

  // Normalizar primaryColor: si es hex, no modificar; si es HSL, usar como está
  const primaryColor = settings.primaryColor || '#E8752F';
  root.style.setProperty('--primary', primaryColor);
  
  // Aplicar otras propiedades
  if (settings.compactMode !== undefined) {
    root.style.setProperty('--radius', settings.compactMode ? '0.5rem' : '0.75rem');
  }

  root.classList.toggle('dark', settings.appTheme === 'dark' || settings.appTheme === 'dark-pro' as any);
  root.classList.toggle('compact-mode', settings.compactMode === true);
  
  // Persistir para próxima carga
  localStorage.setItem('wm_erp_theme', dataTheme);

  // Forzar re-render de todos los elementos dependientes del tema
  document.body.style.transition = 'background-color 0.2s ease';
}