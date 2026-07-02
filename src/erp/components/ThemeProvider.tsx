import React, { useEffect, useMemo } from 'react';
import { useErp } from '../store';

/**
 * ThemeProvider — Inyecta variables CSS dinámicas en el DOM
 * basadas en la configuración del store de Ajustes.
 * 
 * Se sincroniza con: appTheme, primaryColor, compactMode, fontSize,
 * sidebarCollapsed, animationsEnabled.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appSettings } = useErp();

  // Memoizar el estilo para evitar re-renders innecesarios
  const style = useMemo(() => {
    const vars: Record<string, string> = {};
    const s = appSettings;

    // Color primario HSL para Tailwind/Shadcn
    if (s.primaryColor) {
      const hex = s.primaryColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, sVal = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        sVal = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
          case g: h = ((b - r) / d + 2) * 60; break;
          case b: h = ((r - g) / d + 4) * 60; break;
        }
      }
      vars['--primary-hue'] = `${Math.round(h)} ${Math.round(sVal * 100)}% ${Math.round(l * 100)}%`;
      vars['--color-primary'] = s.primaryColor;
    }

    // Tamaño de fuente
    if (s.fontSize === 'small') {
      vars['--font-size-base'] = '12px';
      vars['--font-size-lg'] = '14px';
    } else if (s.fontSize === 'large') {
      vars['--font-size-base'] = '15px';
      vars['--font-size-lg'] = '18px';
    }

    return vars;
  }, [appSettings.primaryColor, appSettings.fontSize]);

  useEffect(() => {
    const doc = document.documentElement;
    const s = appSettings;

    // Tema visual
    const themeMap: Record<string, string> = {
      'ant-design': 'ant-design',
      'dark-pro': 'dark-pro',
      'material3': 'material3',
      'glassmorphism': 'glassmorphism',
      'neomorphism': 'neomorphism',
      'light': 'ant-design',
      'dark': 'dark-pro',
      'high-contrast': 'high-contrast',
    };
    const resolvedTheme = themeMap[s.appTheme] || 'ant-design';
    doc.setAttribute('data-theme', resolvedTheme);

    // Dark/Light para Tailwind
    const isDark = resolvedTheme === 'dark-pro' || resolvedTheme?.includes('dark');
    doc.classList.toggle('dark', isDark);

    // Modo compacto
    doc.classList.toggle('compact', s.compactMode);

    // Tamaño de fuente
    doc.setAttribute('data-font-size', s.fontSize);

    // Personalización avanzada Fase 7
    doc.setAttribute('data-font-family', s.fontFamily);
    doc.setAttribute('data-border-radius', s.borderRadius);
    doc.setAttribute('data-spacing-scale', s.spacingScale);
    doc.setAttribute('data-density-table', s.densityTable);
    doc.setAttribute('data-touch-mode', String(s.touchMode));

    // Animaciones
    if (!s.animationsEnabled) {
      doc.classList.add('animations-disabled');
    } else {
      doc.classList.remove('animations-disabled');
    }

    // Sidebar collapsed (para CSS)
    doc.classList.toggle('sidebar-collapsed', s.sidebarCollapsed);

    // Breadcrumbs / footer
    doc.setAttribute('data-breadcrumbs-enabled', String(s.breadcrumbsEnabled));
    doc.setAttribute('data-footer-enabled', String(s.footerEnabled));
  }, [appSettings]);

  return (
    <>
      {/* Inyectar variables CSS dinámicas */}
      <style id="theme-vars">{`:root { ${Object.entries(style).map(([k, v]) => `${k}: ${v};`).join(' ')} }`}</style>
      {children}
    </>
  );
};

export default ThemeProvider;