/**
 * 🎨 Generador de tema dinámico para CONSTRUSMART ERP
 * Basado en: TECHNICAL_IMPLEMENTATION_GUIDE.md - Theme engine refactor
 */

interface ThemeSettings {
  primaryColor?: string;
  appTheme?: 'light' | 'dark' | 'high-contrast';
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
  const baseHsl = settings.primaryColor || '18 80% 52%';

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
      colorPrimary: settings.primaryColor || '#E8752F',
      borderRadius: isModerno ? 8 : 12,
      controlHeight: isCompact ? 32 : isModerno ? 36 : 40,
    },
  };
}

/**
 * Aplica variables CSS al :root del documento
 */
export function applyThemeToDocument(settings: ThemeSettings): void {
  const root = document.documentElement;
  const vars = generateThemeCSSVariables(settings);

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.classList.toggle('dark', settings.appTheme === 'dark');
  root.classList.toggle('compact-mode', settings.compactMode === true);
}