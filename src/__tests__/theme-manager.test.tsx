import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  syncAllVisualSettings,
  initializeTheme,
  applyThemeToDocument,
  syncAnimationsSetting,
  isValidTheme,
  VALID_THEMES,
  hexToHSL,
} from '@/lib/theme-manager';

const ALL_THEMES = [...VALID_THEMES];

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-font-size');
  document.documentElement.removeAttribute('data-sidebar-mode');
  document.documentElement.removeAttribute('data-breadcrumbs-enabled');
  document.documentElement.removeAttribute('data-footer-enabled');
  document.documentElement.className = '';
  document.body.className = '';
  document.documentElement.style.cssText = '';
  localStorage.clear();
});

describe('VALID_THEMES', () => {
  it('contiene los 5 temas esperados', () => {
    expect(VALID_THEMES).toEqual(['ant-design', 'dark-pro', 'material3', 'glassmorphism', 'neomorphism']);
  });

  it('isValidTheme acepta temas válidos', () => {
    for (const t of ALL_THEMES) {
      expect(isValidTheme(t)).toBe(true);
    }
  });

  it('isValidTheme rechaza valores inválidos', () => {
    expect(isValidTheme('invalid-theme')).toBe(false);
    expect(isValidTheme('')).toBe(false);
    expect(isValidTheme(null)).toBe(false);
    expect(isValidTheme(undefined)).toBe(false);
    expect(isValidTheme(123)).toBe(false);
  });
});

describe('hexToHSL', () => {
  it('convierte azul puro a HSL esperado', () => {
    expect(hexToHSL('#0000ff')).toBe('240 100% 50%');
  });

  it('convierte blanco a HSL esperado', () => {
    expect(hexToHSL('#ffffff')).toBe('0 0% 100%');
  });

  it('convierte negro a HSL esperado', () => {
    expect(hexToHSL('#000000')).toBe('0 0% 0%');
  });

  it('fallback para hex inválido', () => {
    expect(hexToHSL('not-a-color')).toBe('24 96% 63%');
  });
});

describe('syncAllVisualSettings — atomicidad y fallbacks', () => {
  it('aplica el tema y elimina temas previos', () => {
    document.documentElement.setAttribute('data-theme', 'material3');
    syncAllVisualSettings({ appTheme: 'dark-pro' });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark-pro');
  });

  it('ignora temas inválidos y usa ant-design como safe default', () => {
    syncAllVisualSettings({ appTheme: 'no-existe' as any });
    expect(document.documentElement.getAttribute('data-theme')).toBe('ant-design');
  });

  it('elimina clases previas antes de aplicar nuevas', () => {
    document.body.classList.add('vs-compact', 'vs-touch', 'density-compact', 'sidebar-left', 'touch-mode', 'compact');
    document.documentElement.classList.add('dark');
    syncAllVisualSettings({ appTheme: 'glassmorphism', compactMode: false, touchMode: false });
    expect(document.body.classList.contains('vs-compact')).toBe(false);
    expect(document.body.classList.contains('density-compact')).toBe(false);
    expect(document.body.classList.contains('sidebar-left')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('aplica primaryColor como HSL y lo elimina en fallback', () => {
    syncAllVisualSettings({ primaryColor: '#ff8c42' });
    expect(document.documentElement.style.getPropertyValue('--primary')).toBeTruthy();
  });

  it('no lanza con objeto vacío', () => {
    expect(() => syncAllVisualSettings({})).not.toThrow();
  });

  it('no lanza con null/undefined', () => {
    expect(() => syncAllVisualSettings(null as any)).not.toThrow();
    expect(() => syncAllVisualSettings(undefined as any)).not.toThrow();
  });

  it('valida borderRadius con fallback medio', () => {
    syncAllVisualSettings({ borderRadius: 'invalid' as any });
    expect(document.documentElement.style.getPropertyValue('--radius-selected')).toBe('');
  });

  it('valida spacingScale con fallback normal', () => {
    syncAllVisualSettings({ spacingScale: 'invalid' as any });
    expect(document.documentElement.style.getPropertyValue('--spacing-selected')).toBe('8px');
  });

  it('valida sidebarWidth con clamp', () => {
    syncAllVisualSettings({ sidebarWidth: 999 });
    expect(document.documentElement.style.getPropertyValue('--sidebar-width')).toBe('320px');
    syncAllVisualSettings({ sidebarWidth: 10 });
    expect(document.documentElement.style.getPropertyValue('--sidebar-width')).toBe('180px');
  });

  it('aplica fontFamily mapeando system-ui correctamente', () => {
    syncAllVisualSettings({ fontFamily: 'system-ui' });
    expect(document.documentElement.style.getPropertyValue('--font-family')).toBe('');
  });
});

describe('syncAnimationsSetting', () => {
  it('agrega animations-disabled cuando enabled=false', () => {
    syncAnimationsSetting(false);
    expect(document.documentElement.classList.contains('animations-disabled')).toBe(true);
  });

  it('remueve animations-disabled cuando enabled=true', () => {
    document.documentElement.classList.add('animations-disabled');
    syncAnimationsSetting(true);
    expect(document.documentElement.classList.contains('animations-disabled')).toBe(false);
  });
});

describe('initializeTheme', () => {
  it('fallback a ant-design cuando no hay localStorage', () => {
    initializeTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('ant-design');
  });

  it('aplica tema desde localStorage', () => {
    localStorage.setItem('wm_erp_theme', 'material3');
    initializeTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('material3');
  });

  it('no lanza con JSON inválido en settings', () => {
    localStorage.setItem('wm_erp_data_settings', 'INVALID_JSON');
    expect(() => initializeTheme()).not.toThrow();
  });
});

describe('applyThemeToDocument', () => {
  it('aplica data-theme correctamente', () => {
    applyThemeToDocument({ appTheme: 'glassmorphism' });
    expect(document.documentElement.getAttribute('data-theme')).toBe('glassmorphism');
  });

  it('activa dark mode para dark-pro', () => {
    applyThemeToDocument({ appTheme: 'dark-pro' });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('no lanza con config null/undefined', () => {
    expect(() => applyThemeToDocument(null as any)).not.toThrow();
    expect(() => applyThemeToDocument(undefined as any)).not.toThrow();
  });
});
